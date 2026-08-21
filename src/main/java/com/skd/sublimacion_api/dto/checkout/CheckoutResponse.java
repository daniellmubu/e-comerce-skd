package com.skd.sublimacion_api.dto.checkout;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CheckoutResponse {

    private Long pedidoId;

    private Long pagoId;

    private Long facturaId;
    private String numeroFactura;

    private BigDecimal subtotal;

    private BigDecimal descuento;

    private BigDecimal costoEnvio;

    private Integer diasEstimadosEntrega;

    private BigDecimal total;

    private String estado;

    private String mensaje;

}