package com.skd.sublimacion_api.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificacionEvent {

    private Long notificacionId;

    private String tipo;

    private String titulo;

    private String mensaje;

    private LocalDateTime timestamp;
}