package com.skd.sublimacion_api.dto.pedido;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ItemPedidoResponse {

    private Long id;

    private Long productoId;

    private String producto;

    private Integer cantidad;

    private BigDecimal precioUnitario;

    private BigDecimal subtotal;

    private Long disenoId;

    private String imagenDisenoUrl;
}