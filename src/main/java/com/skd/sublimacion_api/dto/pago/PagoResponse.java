package com.skd.sublimacion_api.dto.pago;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PagoResponse {

    private Long id;

    private Long pedidoId;

    private String metodo;

    private String estado;

    private String referenciaExterna;

    private BigDecimal monto;

    private LocalDateTime procesadoEn;

}