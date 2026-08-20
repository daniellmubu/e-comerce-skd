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
public class PedidoEstadoEvent {

    private Long pedidoId;

    private String estado;

    private LocalDateTime timestamp;
}