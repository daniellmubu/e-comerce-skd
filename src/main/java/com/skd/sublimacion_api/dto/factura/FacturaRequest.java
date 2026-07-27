package com.skd.sublimacion_api.dto.factura;

import lombok.Data;

@Data
public class FacturaRequest {

    private Long pedidoId;

    private String numeroFactura;

    private String archivoPdfUrl;

}