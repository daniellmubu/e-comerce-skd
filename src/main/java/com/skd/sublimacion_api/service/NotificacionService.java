package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.notificacion.NotificacionResponse;

import java.util.List;

public interface NotificacionService {

    NotificacionResponse crear(Long usuarioId, String tipo, String titulo, String mensaje);

    List<NotificacionResponse> listarMias(Long usuarioId);

    long contarNoLeidas(Long usuarioId);

    void marcarLeida(Long id, Long usuarioId);

    void marcarTodasLeidas(Long usuarioId);
}