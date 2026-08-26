package com.skd.sublimacion_api.dto.producto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class VarianteProductoResponse {

    private Long id;

    private String talla;

    private String color;

    private BigDecimal precio;

    private Integer stock;

    private String sku;
}