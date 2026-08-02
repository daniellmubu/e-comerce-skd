package com.skd.sublimacion_api.mapper;

import org.springframework.stereotype.Component;

import com.skd.sublimacion_api.dto.categoria.CategoriaResponse;
import com.skd.sublimacion_api.entity.Categoria;

@Component
public class CategoriaMapper {

    public CategoriaResponse toResponse(Categoria categoria) {

        if (categoria == null) {
            return null;
        }

        return CategoriaResponse.builder()
                .id(categoria.getId())
                .nombre(categoria.getNombre())
                .descripcion(categoria.getDescripcion())
                .categoriaPadreId(
                        categoria.getCategoriaPadre() != null
                                ? categoria.getCategoriaPadre().getId()
                                : null
                )
                .build();
    }
}