package com.skd.sublimacion_api.dto.categoria;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoriaResponse {

    private Long id;

    private String nombre;

    private String descripcion;

    private Long categoriaPadreId;
}