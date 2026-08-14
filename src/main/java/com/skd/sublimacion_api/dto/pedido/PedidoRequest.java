package com.skd.sublimacion_api.dto.pedido;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import lombok.Data;

@Data
public class PedidoRequest {

    private Long direccionId;

    private Long empaqueId;

    private Long cuponId;

    private BigDecimal subtotal;

    private BigDecimal costoEnvio;

    private BigDecimal descuento;

    private BigDecimal total;

    private LocalDate fechaEntregaDeseada;

    private List<ItemPedidoRequest> items;

}