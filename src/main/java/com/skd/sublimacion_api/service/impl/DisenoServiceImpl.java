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

import java.util.List;
import java.util.Map;

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

    // FLUX.1 [schnell] via Cloudflare Workers AI: nivel gratuito real
    // (10,000 Neurons/dia, sin tarjeta).
    private static final String MODELO = "@cf/black-forest-labs/flux-1-schnell";

    @Override
    public DisenoResponse generar(DisenoRequest request, Long usuarioId) {

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

        Map<String, Object> respuesta = client.post()
                .uri(url)
                .header("Authorization", "Bearer " + cloudflareApiToken)
                .bodyValue(Map.of("prompt", promptFinal))
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (respuesta == null || Boolean.FALSE.equals(respuesta.get("success"))) {
            throw new BadRequestException("Cloudflare no pudo generar la imagen. Intenta de nuevo.");
        }

        Map<String, Object> result = (Map<String, Object>) respuesta.get("result");
        if (result == null || result.get("image") == null) {
            throw new BadRequestException("La IA no devolvió ninguna imagen. Intenta con otro prompt.");
        }

        String base64 = (String) result.get("image");

        // Guardamos la imagen como data URI directamente en la columna TEXT.
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
