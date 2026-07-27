package com.skd.sublimacion_api.dto.pedido;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PedidoRequest {

    private Long usuarioId;

    private Long direccionId;

    private Long empaqueId;

    private Long cuponId;

    private BigDecimal subtotal;

    private BigDecimal costoEnvio;

    private BigDecimal descuento;

    private BigDecimal total;

    private LocalDate fechaEntregaDeseada;

}