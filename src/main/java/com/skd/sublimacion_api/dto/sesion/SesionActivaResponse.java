package com.skd.sublimacion_api.dto.sesion;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Sesión activa visible en el panel admin (Seguridad -> Sesiones activas).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SesionActivaResponse {

    private Long id;

    private String dispositivo;

    private String navegador;

    private String ip;

    private LocalDateTime creadoEn;

    private LocalDateTime expiraEn;

    /** true si es la sesión del dispositivo desde el que se consulta. */
    private boolean esActual;
}
