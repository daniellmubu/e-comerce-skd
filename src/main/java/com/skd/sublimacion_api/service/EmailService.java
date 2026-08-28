package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.event.CheckoutCompletadoEvent;

public interface EmailService {

    void enviarFacturaCompra(CheckoutCompletadoEvent evento);

    void enviarBienvenida(String correo, String nombre);

    void enviarRestablecerPassword(String correo, String nombre, String token);

    void enviarNotificacion(String correo, String nombre, String titulo, String mensaje);

}
