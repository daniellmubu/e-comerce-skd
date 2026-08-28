package com.skd.sublimacion_api.dto.notificacion;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificacionResponse {

    private Long id;

    private String tipo;

    private String titulo;

    private String mensaje;

    private Boolean leida;

    private LocalDateTime creadoEn;
}