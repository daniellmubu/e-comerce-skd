package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.event.CheckoutCompletadoEvent;

public interface EmailService {

    void enviarFacturaCompra(CheckoutCompletadoEvent evento);

    void enviarBienvenida(String correo, String nombre);

}
