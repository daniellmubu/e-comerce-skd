package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.galeria.GaleriaItemResponse;
import com.skd.sublimacion_api.entity.Resena;
import com.skd.sublimacion_api.repository.ResenaRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/galeria-clientes")
@RequiredArgsConstructor
@Tag(name = "Galería de clientes", description = "Fotos reales de clientes (reseñas aprobadas con imagen).")
public class GaleriaController {

    private final ResenaRepository resenaRepository;

    @Operation(summary = "Galería de clientes", description = "Devuelve reseñas aprobadas que incluyen foto, para mostrar el social proof.")
    @GetMapping
    public Page<GaleriaItemResponse> listar(
            @PageableDefault(size = 12, sort = "creadoEn", direction = Sort.Direction.DESC) Pageable pageable) {

        return resenaRepository
                .findByEstadoAndImagenUrlIsNotNull("aprobada", pageable)
                .map(this::aGaleriaItem);
    }

    private GaleriaItemResponse aGaleriaItem(Resena r) {
        return GaleriaItemResponse.builder()
                .id(r.getId())
                .imagenUrl(r.getImagenUrl())
                .comentario(r.getComentario())
                .calificacion(r.getCalificacion())
                .productoNombre(r.getProducto().getNombre())
                .productoId(r.getProducto().getId())
                .usuarioNombre(r.getUsuario().getNombre())
                .creadoEn(r.getCreadoEn())
                .build();
    }
}