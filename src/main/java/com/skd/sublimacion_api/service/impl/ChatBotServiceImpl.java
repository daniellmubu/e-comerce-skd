package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.dto.chat.ChatMensajeDto;
import com.skd.sublimacion_api.dto.chat.ChatRequest;
import com.skd.sublimacion_api.dto.chat.ChatResponse;
import com.skd.sublimacion_api.exeption.BadRequestException;
import com.skd.sublimacion_api.exeption.TooManyRequestsException;
import com.skd.sublimacion_api.service.ChatBotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatBotServiceImpl implements ChatBotService {

    private final WebClient.Builder webClientBuilder;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

    private static final String GEMINI_URL_FALLBACK =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

    private static final Duration TIMEOUT = Duration.ofSeconds(20);

    private static final String SYSTEM_PROMPT = """
            Eres el asistente virtual oficial de SKD, una tienda e-commerce de sublimación especializada exclusivamente en artículos cilíndricos: mugs tradicionales, mugs mágicos y jarras cerveceras. Tu objetivo es ayudar a los clientes a perfilar sus ideas de diseño, explicarles cómo funciona el proceso de personalización y guiarlos en el flujo de compra.

            Directrices:
            - Sé amable, servicial, persuasivo y mantén tus respuestas breves (máximo un párrafo).
            - Si el usuario te da una idea general para un diseño (ej. 'quiero un gato'), ayúdalo a enriquecerla describiendo estilos (ej. minimalista, acuarela, cyberpunk) para que el generador de imágenes de la tienda actúe con precisión.
            - Nunca inventes precios, costos de envío ni políticas que no existan en la tienda. Remítelo siempre a las secciones oficiales de la plataforma.
            """;

    @Override
    @SuppressWarnings("unchecked")
    public ChatResponse responder(ChatRequest request) {

        // Construir contents: historial mapeado + mensaje actual
        List<Map<String, Object>> contents = new ArrayList<>();

        if (request.getHistorial() != null) {
            for (ChatMensajeDto m : request.getHistorial()) {
                // Evitar roles inválidos o textos nulos/vacíos que rompen Map.of
                if (m.getRol() == null || m.getTexto() == null || m.getTexto().isBlank()) {
                    continue;
                }
                String rol = m.getRol().trim();
                if (!"user".equals(rol) && !"model".equals(rol)) {
                    continue;
                }
                contents.add(Map.of(
                        "role", rol,
                        "parts", List.of(Map.of("text", m.getTexto()))
                ));
            }
        }

        // Mensaje actual como role "user"
        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", request.getMensaje()))
        ));

        // Gemini exige que contents empiece con role "user".
        // El frontend envía el saludo inicial del bot ("Hola, ¿en qué puedo ayudarte?")
        // como primer elemento con rol "model", lo que provoca 400 Bad Request.
        // Eliminamos mensajes iniciales con rol "model" hasta encontrar el primer "user".
        while (!contents.isEmpty() && !"user".equals(contents.get(0).get("role"))) {
            contents.remove(0);
        }

        // Si tras filtrar no queda nada (no debería pasar porque siempre añadimos el mensaje actual),
        // protegemos contra lista vacía.
        if (contents.isEmpty()) {
            contents.add(Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", request.getMensaje()))
            ));
        }

        Map<String, Object> body = new HashMap<>();
        body.put("system_instruction", Map.of(
                "parts", List.of(Map.of("text", SYSTEM_PROMPT))
        ));
        body.put("contents", contents);

        WebClient client = webClientBuilder.build();

        try {
            Map<String, Object> respuesta = null;
            try {
                respuesta = client.post()
                        .uri(GEMINI_URL)
                        .header("x-goog-api-key", geminiApiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .timeout(TIMEOUT)
                        .block();
            } catch (WebClientResponseException ex) {
                // Fallback si cuota diaria (20/día) o alta demanda en 3.5-flash / 3.6-flash
                int status = ex.getStatusCode().value();
                String detalle = ex.getResponseBodyAsString();
                log.warn("Gemini primario {} falló {}: {}", GEMINI_URL, status, detalle);
                if (status == 429 || status == 503) {
                    log.info("Reintentando con modelo fallback {}", GEMINI_URL_FALLBACK);
                    respuesta = client.post()
                            .uri(GEMINI_URL_FALLBACK)
                            .header("x-goog-api-key", geminiApiKey)
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(body)
                            .retrieve()
                            .bodyToMono(Map.class)
                            .timeout(TIMEOUT)
                            .block();
                } else {
                    throw ex;
                }
            }

            if (respuesta == null) {
                log.error("Gemini devolvió respuesta nula");
                throw new BadRequestException("Ocurrió un error al procesar tu mensaje. Inténtalo de nuevo más tarde.");
            }

            // Extraer candidates[0].content.parts[0].text
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) respuesta.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                log.error("Gemini respuesta sin candidates: {}", respuesta);
                throw new BadRequestException("Ocurrió un error al procesar tu mensaje. Inténtalo de nuevo más tarde.");
            }

            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            if (content == null) {
                log.error("Gemini candidate sin content: {}", candidates.get(0));
                throw new BadRequestException("Ocurrió un error al procesar tu mensaje. Inténtalo de nuevo más tarde.");
            }

            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            if (parts == null || parts.isEmpty() || parts.get(0).get("text") == null) {
                log.error("Gemini content sin parts/text: {}", content);
                throw new BadRequestException("Ocurrió un error al procesar tu mensaje. Inténtalo de nuevo más tarde.");
            }

            String texto = (String) parts.get(0).get("text");
            return new ChatResponse(texto);

        } catch (WebClientResponseException ex) {
            String detalle = ex.getResponseBodyAsString();
            log.error("Gemini respondió {}: {}", ex.getStatusCode().value(), detalle);
            if (ex.getStatusCode().value() == 429) {
                throw new TooManyRequestsException(
                        "El asistente alcanzó el límite de uso de la IA. Espera 1 minuto e inténtalo de nuevo. Si persiste, la cuota diaria gratuita (20/día) se agotó y se reinicia mañana.");
            }
            if (ex.getStatusCode().value() == 503) {
                throw new TooManyRequestsException(
                        "El asistente está saturado por alta demanda. Espera unos segundos e inténtalo de nuevo.");
            }
            throw new BadRequestException("Ocurrió un error al procesar tu mensaje. Inténtalo de nuevo más tarde.");
        } catch (RuntimeException ex) {
            if (ex instanceof BadRequestException) {
                throw ex;
            }
            if (ex instanceof TooManyRequestsException) {
                throw ex;
            }
            if (ex.getCause() instanceof java.util.concurrent.TimeoutException) {
                log.error("Timeout al llamar a Gemini (20s)", ex);
                throw new BadRequestException("Ocurrió un error al procesar tu mensaje. Inténtalo de nuevo más tarde.");
            }
            String msg = ex.getMessage() != null ? ex.getMessage().toLowerCase() : "";
            if (msg.contains("timeout") || msg.contains("timed out")) {
                log.error("Timeout al llamar a Gemini", ex);
                throw new BadRequestException("Ocurrió un error al procesar tu mensaje. Inténtalo de nuevo más tarde.");
            }
            log.error("Error inesperado al llamar a Gemini", ex);
            throw new BadRequestException("Ocurrió un error al procesar tu mensaje. Inténtalo de nuevo más tarde.");
        }
    }
}
