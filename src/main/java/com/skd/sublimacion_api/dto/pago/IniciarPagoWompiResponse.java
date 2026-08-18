package com.skd.sublimacion_api.dto.pago;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class IniciarPagoWompiResponse {

    private Long pagoId;

    private Long pedidoId;

    private String url;

    private String referencia;

}
