package com.skd.sublimacion_api.dto.detallecarrito;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ItemCarritoResponse {

    private Long id;

    private Long carritoId;

    private Long productoId;

    private String producto;

    private Integer cantidad;

    private BigDecimal precioUnitario;

    private BigDecimal subtotal;

    private Long disenoId;

    private String imagenDisenoUrl;
}