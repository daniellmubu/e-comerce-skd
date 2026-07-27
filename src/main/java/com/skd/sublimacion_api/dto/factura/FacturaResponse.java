package com.skd.sublimacion_api.dto.factura;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FacturaResponse {

    private Long id;

    private Long pedidoId;

    private String numeroFactura;

    private String archivoPdfUrl;

    private LocalDateTime emitidaEn;

}