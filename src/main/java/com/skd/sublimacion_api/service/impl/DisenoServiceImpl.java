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

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
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

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service.key}")
    private String supabaseServiceKey;

    @Value("${supabase.storage.bucket}")
    private String supabaseBucket;

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

        String promptFinal = construirPrompt(request);
        byte[] imagenBruta = generarImagenConCloudflare(promptFinal);
        ImagenProcesada procesada = procesarImagen(imagenBruta);
        String imagenUrl = subirImagenASupabase(
                procesada.bytes(), procesada.extension(), procesada.contentType());

        Diseno diseno = Diseno.builder()
                .usuario(usuario)
                .producto(producto)
                .imagenUrl(imagenUrl)
                .prompt(request.getPrompt())
                .build();

        DisenoResponse response = convertir(disenoRepository.save(diseno));
        response.setValido(procesada.valido());
        return response;
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

    private String construirPrompt(DisenoRequest r) {
        return String.format(
                "Sticker art, die-cut style, isolated on a plain white background, "
                        + "vibrant colors, clean edges, high quality, no text, no mockup, "
                        + "no product. Design: %s",
                r.getPrompt()
        );
    }

    @SuppressWarnings("unchecked")
    private byte[] generarImagenConCloudflare(String promptFinal) {

        String url = "https://api.cloudflare.com/client/v4/accounts/"
                + cloudflareAccountId + "/ai/run/" + MODELO;

        WebClient client = webClientBuilder.build();

        Map<String, Object> respuesta;
        try {
            respuesta = client.post()
                    .uri(url)
                    .header("Authorization", "Bearer " + cloudflareApiToken)
                    .bodyValue(Map.of("prompt", promptFinal, "steps", 8))
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
        return Base64.getDecoder().decode(base64);
    }

    private ImagenProcesada procesarImagen(byte[] imagenBytes) {
        final int UMBRAL_BLANCO = 235;
        final int TOLERANCIA_CUADRADA = 30 * 30;
        final int MAX_RATIO_OPACOS = 60;

        try {
            BufferedImage original = ImageIO.read(new ByteArrayInputStream(imagenBytes));
            if (original == null) {
                return new ImagenProcesada(imagenBytes, ".jpg", "image/jpeg", false);
            }

            int w = original.getWidth();
            int h = original.getHeight();

            BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
            img.getGraphics().drawImage(original, 0, 0, null);
            int[] pixels = img.getRGB(0, 0, w, h, null, 0, w);

            // 1. Si las 4 esquinas no son blancas, la IA generó un mockup completo.
            int[] esquinas = {pixels[0], pixels[w - 1], pixels[(h - 1) * w], pixels[h * w - 1]};
            for (int p : esquinas) {
                int r = (p >> 16) & 0xFF, g = (p >> 8) & 0xFF, b = p & 0xFF;
                if (r <= UMBRAL_BLANCO || g <= UMBRAL_BLANCO || b <= UMBRAL_BLANCO) {
                    return new ImagenProcesada(imagenBytes, ".jpg", "image/jpeg", false);
                }
            }

            // 2. Inundación desde las esquinas para volver transparente el fondo blanco.
            int ref = pixels[0];
            int refR = (ref >> 16) & 0xFF, refG = (ref >> 8) & 0xFF, refB = ref & 0xFF;

            boolean[] visitado = new boolean[w * h];
            ArrayDeque<Integer> pila = new ArrayDeque<>();
            pila.push(0);
            pila.push(w - 1);
            pila.push((h - 1) * w);
            pila.push(h * w - 1);

            while (!pila.isEmpty()) {
                int pos = pila.pop();
                if (visitado[pos]) continue;

                int px = pixels[pos];
                int r = (px >> 16) & 0xFF, g = (px >> 8) & 0xFF, b = px & 0xFF;
                int dr = r - refR, dg = g - refG, db = b - refB;
                if (dr * dr + dg * dg + db * db > TOLERANCIA_CUADRADA) continue;

                visitado[pos] = true;
                pixels[pos] = px & 0x00FFFFFF;

                int x = pos % w;
                int y = pos / w;
                if (x + 1 < w) pila.push(pos + 1);
                if (x - 1 >= 0) pila.push(pos - 1);
                if (y + 1 < h) pila.push(pos + w);
                if (y - 1 >= 0) pila.push(pos - w);
            }

            // 3. Si queda demasiado contenido opaco, es un mockup y no un gráfico
            //    suelto. A la vez calculamos el recuadro del contenido para
            //    recortar el borde transparente sobrante.
            long opacos = 0;
            int minX = w, minY = h, maxX = -1, maxY = -1;
            for (int y = 0; y < h; y++) {
                for (int x = 0; x < w; x++) {
                    int p = pixels[y * w + x];
                    if ((p >>> 24) != 0) {
                        opacos++;
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }
            if (opacos == 0 || opacos * 100 / ((long) w * h) > MAX_RATIO_OPACOS) {
                return new ImagenProcesada(imagenBytes, ".jpg", "image/jpeg", false);
            }

            img.setRGB(0, 0, w, h, pixels, 0, w);
            BufferedImage recortado = img.getSubimage(minX, minY, maxX - minX + 1, maxY - minY + 1);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(recortado, "png", baos);
            return new ImagenProcesada(baos.toByteArray(), ".png", "image/png", true);
        } catch (IOException ex) {
            return new ImagenProcesada(imagenBytes, ".jpg", "image/jpeg", false);
        }
    }

    private String subirImagenASupabase(byte[] imagenBytes, String extension, String contentType) {
        String nombreArchivo = UUID.randomUUID() + extension;
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + supabaseBucket + "/" + nombreArchivo;

        WebClient client = webClientBuilder.build();

        try {
            client.post()
                    .uri(uploadUrl)
                    .header("Authorization", "Bearer " + supabaseServiceKey)
                    .header("apikey", supabaseServiceKey)
                    .header("Content-Type", contentType)
                    .bodyValue(imagenBytes)
                    .retrieve()
                    .toBodilessEntity()
                    .timeout(TIMEOUT_CLOUDFLARE)
                    .block();
        } catch (RuntimeException ex) {
            throw new BadRequestException(
                    "No se pudo guardar la imagen del diseño. Intenta de nuevo.");
        }

        return supabaseUrl + "/storage/v1/object/public/" + supabaseBucket + "/" + nombreArchivo;
    }

    private record ImagenProcesada(byte[] bytes, String extension, String contentType, boolean valido) {}

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