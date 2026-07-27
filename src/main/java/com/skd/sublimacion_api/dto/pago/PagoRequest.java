package com.skd.sublimacion_api.dto.pago;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PagoRequest {

    private Long pedidoId;

    private String metodo;

    private BigDecimal monto;

}