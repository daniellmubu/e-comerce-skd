package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.usuario.CambioPendienteResponse;
import com.skd.sublimacion_api.dto.usuario.UsuarioRequest;

import java.util.List;

/**
 * Gestiona las solicitudes de cambio de datos de usuario iniciadas por un
 * administrador. El cambio NUNCA se aplica directamente: queda pendiente hasta
 * que el propio usuario lo aprueba desde el correo (double opt-in).
 */
public interface CambioPendienteService {

    /**
     * Registra la solicitud de actualización de datos, genera el token y envía
     * el correo de aprobación al correo actual del usuario.
     *
     * @return la solicitud pendiente creada (no el usuario modificado).
     */
    CambioPendienteResponse solicitarActualizacion(Long usuarioId, UsuarioRequest request);

    /**
     * Aplica los cambios pendientes si el token es válido y el usuario lo aprueba.
     *
     * @return mensaje de confirmación.
     */
    String aprobar(String token);

    /**
     * Invalida la solicitud sin aplicar ningún cambio.
     *
     * @return mensaje de confirmación.
     */
    String rechazar(String token);

    /**
     * Lista las solicitudes de cambio de un usuario (para consulta del admin).
     */
    List<CambioPendienteResponse> listarPorUsuario(Long usuarioId);
}
