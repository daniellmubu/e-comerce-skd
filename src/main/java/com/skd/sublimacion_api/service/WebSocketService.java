package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.websocket.PedidoEstadoEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void publicarEstadoPedido(Long pedidoId, String estado) {

        PedidoEstadoEvent evento = PedidoEstadoEvent.builder()
                .pedidoId(pedidoId)
                .estado(estado)
                .timestamp(LocalDateTime.now())
                .build();

        messagingTemplate.convertAndSend("/topic/pedidos/" + pedidoId, evento);
    }
}