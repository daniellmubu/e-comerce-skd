package com.skd.sublimacion_api.dto.pago;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SimulacionPagoResponse {

    private Long pagoId;

    private Long pedidoId;

    private String estadoPago;

    private String estadoPedido;

    private boolean aprobado;

    private String mensaje;

}
