package com.skd.sublimacion_api.dto.usuario;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Respuesta de una solicitud de cambio de datos de usuario.
 * Devuelve el estado de la solicitud (normalmente PENDIENTE), no el usuario ya
 * modificado, porque el cambio no se aplica hasta que el cliente lo aprueba
 * desde el correo.
 */
@Data
@Builder
public class CambioPendienteResponse {

    private Long id;

    private Long usuarioId;

    private String estado;

    /** Valores propuestos. */
    private String nombre;

    private String username;

    private String correo;

    private String telefono;

    private LocalDateTime fechaExpiracion;

    private LocalDateTime fechaCreacion;
}
