package com.skd.sublimacion_api.dto.variante;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Data;

/**
 * Respuesta del CRUD admin de variantes (alineada con VarianteProductoResponse).
 */
@Data
@Builder
public class VarianteResponse {

    private Long id;

    private Long productoId;

    private String productoNombre;

    private String talla;

    private String color;

    private BigDecimal precio;

    private Integer stock;

    private String sku;
}
