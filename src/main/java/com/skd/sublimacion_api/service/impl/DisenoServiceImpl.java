package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.dto.diseno.DisenoRequest;
import com.skd.sublimacion_api.dto.diseno.DisenoResponse;
import com.skd.sublimacion_api.entity.Diseno;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.DisenoRepository;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.service.DisenoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DisenoServiceImpl implements DisenoService {

    private final DisenoRepository disenoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;

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
        String imagenUrl = generarImagenUrl(promptFinal);

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
                "diseño de sublimación para %s, %s, fondo blanco, centrado, alta calidad, ilustración vectorial",
                tipo, r.getPrompt()
        );
    }
    
    private String generarImagenUrl(String promptFinal) {
        String promptCodificado = URLEncoder.encode(promptFinal, StandardCharsets.UTF_8);
        return "https://image.pollinations.ai/prompt/" + promptCodificado
                + "?width=1024&height=1024&nologo=true";
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