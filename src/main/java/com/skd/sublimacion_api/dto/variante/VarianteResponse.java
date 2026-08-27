package com.skd.sublimacion_api.dto.variante;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VarianteResponse {

    private Long id;

    private Long productoId;

    private String productoNombre;

    private String talla;

    private String color;

    private Integer stock;

    private BigDecimal precio;

    private Boolean activo;
}
