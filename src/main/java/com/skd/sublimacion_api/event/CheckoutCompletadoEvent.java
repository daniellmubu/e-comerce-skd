package com.skd.sublimacion_api.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CheckoutCompletadoEvent {

    private final Long facturaId;

    private final String correo;

    private final String nombre;

    private final String numeroFactura;

}
