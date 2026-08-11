package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.dto.diseno.DisenoRequest;
import com.skd.sublimacion_api.dto.diseno.DisenoResponse;
import com.skd.sublimacion_api.entity.Diseno;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.exeption.BadRequestException;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.DisenoRepository;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.service.DisenoService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeoutException;

@Service
@RequiredArgsConstructor
public class DisenoServiceImpl implements DisenoService {

    private final DisenoRepository disenoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;
    private final WebClient.Builder webClientBuilder;

    @Value("${cloudflare.account.id}")
    private String cloudflareAccountId;

    @Value("${cloudflare.api.token}")
    private String cloudflareApiToken;

    private static final String MODELO = "@cf/black-forest-labs/flux-1-schnell";

    // Si Cloudflare no responde en este tiempo, cortamos la espera en vez de
    // dejar la petición colgada indefinidamente.
    private static final Duration TIMEOUT_CLOUDFLARE = Duration.ofSeconds(30);

    private static final int PROMPT_MAX_CARACTERES = 300;

    // Cuota de Cloudflare (10,000 Neurons/día) es compartida entre todos los
    // usuarios de la app; este límite evita que uno solo la agote.
    private static final int LIMITE_GENERACIONES_DIARIAS = 10;

    // Filtro básico de contenido inapropiado. No es exhaustivo: es una primera
    // barrera para bloquear los casos más obvios antes de gastar cuota de la IA.
    private static final List<String> PALABRAS_PROHIBIDAS = List.of(
            "desnudo", "desnuda", "porno", "sexual", "nazi", "violencia explicita"
    );

    @Override
    public DisenoResponse generar(DisenoRequest request, Long usuarioId) {

        validarPrompt(request.getPrompt());
        validarLimiteDiario(usuarioId);

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Producto producto = null;
        if (request.getProductoId() != null) {
            producto = productoRepository.findById(request.getProductoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));
        }

        String promptFinal = construirPrompt(request, producto);
        String imagenUrl = generarImagenConCloudflare(promptFinal);

        Diseno diseno = Diseno.builder()
                .usuario(usuario)
                .producto(producto)
                .imagenUrl(imagenUrl)
                .prompt(request.getPrompt())
                .build();

        return convertir(disenoRepository.save(diseno));
    }

    @Override
    public List<DisenoResponse> listarPorUsuario(Long usuarioId) {

        return disenoRepository.findByUsuarioId(usuarioId)
                .stream()
                .map(this::convertir)
                .toList();
    }

    private void validarLimiteDiario(Long usuarioId) {
        LocalDateTime inicioDelDia = LocalDateTime.now().toLocalDate().atStartOfDay();
        long generadosHoy = disenoRepository.countByUsuarioIdAndCreatedAtAfter(usuarioId, inicioDelDia);

        if (generadosHoy >= LIMITE_GENERACIONES_DIARIAS) {
            throw new BadRequestException(
                    "Alcanzaste el límite de " + LIMITE_GENERACIONES_DIARIAS
                            + " diseños generados hoy. Intenta de nuevo mañana.");
        }
    }

    private void validarPrompt(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            throw new BadRequestException("Debes escribir una descripción para generar el diseño.");
        }

        String limpio = prompt.trim();

        if (limpio.length() > PROMPT_MAX_CARACTERES) {
            throw new BadRequestException(
                    "La descripción es muy larga (máximo " + PROMPT_MAX_CARACTERES + " caracteres).");
        }

        String enMinusculas = limpio.toLowerCase();
        boolean contienePalabraProhibida = PALABRAS_PROHIBIDAS.stream()
                .anyMatch(enMinusculas::contains);

        if (contienePalabraProhibida) {
            throw new BadRequestException(
                    "Esa descripción incluye contenido no permitido. Intenta con otra.");
        }
    }

    private String construirPrompt(DisenoRequest r, Producto producto) {
        String tipo = producto != null ? producto.getNombre() : "producto";
        return String.format(
                "Diseño de sublimación para %s. %s. Ilustración centrada, fondo blanco liso, "
                        + "alta calidad, colores vibrantes, apto para impresión textil/cerámica.",
                tipo, r.getPrompt()
        );
    }

    @SuppressWarnings("unchecked")
    private String generarImagenConCloudflare(String promptFinal) {

        String url = "https://api.cloudflare.com/client/v4/accounts/"
                + cloudflareAccountId + "/ai/run/" + MODELO;

        WebClient client = webClientBuilder.build();

        Map<String, Object> respuesta;
        try {
            respuesta = client.post()
                    .uri(url)
                    .header("Authorization", "Bearer " + cloudflareApiToken)
                    .bodyValue(Map.of("prompt", promptFinal))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(TIMEOUT_CLOUDFLARE)
                    .block();
        } catch (RuntimeException ex) {
            if (ex.getCause() instanceof TimeoutException) {
                throw new BadRequestException(
                        "Cloudflare tardó demasiado en responder. Intenta de nuevo en unos segundos.");
            }
            throw new BadRequestException("Cloudflare no pudo generar la imagen. Intenta de nuevo.");
        }

        if (respuesta == null || Boolean.FALSE.equals(respuesta.get("success"))) {
            throw new BadRequestException("Cloudflare no pudo generar la imagen. Intenta de nuevo.");
        }

        Map<String, Object> result = (Map<String, Object>) respuesta.get("result");
        if (result == null || result.get("image") == null) {
            throw new BadRequestException("La IA no devolvió ninguna imagen. Intenta con otro prompt.");
        }

        String base64 = (String) result.get("image");

        return "data:image/jpeg;base64," + base64;
    }

    private DisenoResponse convertir(Diseno diseno) {
        return DisenoResponse.builder()
                .id(diseno.getId())
                .prompt(diseno.getPrompt())
                .productoId(diseno.getProducto() != null ? diseno.getProducto().getId() : null)
                .producto(diseno.getProducto() != null ? diseno.getProducto().getNombre() : null)
                .imagenUrl(diseno.getImagenUrl())
                .build();
    }
}