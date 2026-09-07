package com.skd.sublimacion_api.dto.ventadirecta;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemVentaDirectaResponse {

    private Long id;

    private Long productoId;

    private String productoNombre;

    private Long varianteId;

    private String talla;

    private String color;

    private String detalle;

    private Integer cantidad;

    private BigDecimal precioUnitario;

    private BigDecimal subtotal;
}
