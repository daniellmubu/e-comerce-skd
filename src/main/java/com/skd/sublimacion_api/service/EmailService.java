package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.event.CheckoutCompletadoEvent;

public interface EmailService {

    void enviarFacturaCompra(CheckoutCompletadoEvent evento);

    void enviarBienvenida(String correo, String nombre);

    void enviarRestablecerPassword(String correo, String nombre, String token);

    /**
     * Envía al usuario una solicitud de aprobación de cambio de sus datos
     * iniciada por un administrador. Incluye enlaces para APROBAR o RECHAZAR
     * el cambio; nada se aplica hasta que el usuario apruebe.
     */
    void enviarConfirmacionCambioDatos(
            String correo,
            String nombre,
            String resumenCambios,
            String token,
            String baseUrl);

    void enviarNotificacion(String correo, String nombre, String titulo, String mensaje);

    void enviarContacto(String nombre, String correo, String asunto, String mensaje);

    void enviarEstadoPedido(String correo, String nombre, Long pedidoId, String estado);

}
