package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.websocket.NotificacionEvent;
import com.skd.sublimacion_api.dto.websocket.PedidoEstadoEvent;
import com.skd.sublimacion_api.dto.websocket.SolicitudDisenoEvent;
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

    public void publicarEstadoSolicitud(Long solicitudId, String estado) {

        SolicitudDisenoEvent evento = SolicitudDisenoEvent.builder()
                .solicitudId(solicitudId)
                .estado(estado)
                .timestamp(LocalDateTime.now())
                .build();

        messagingTemplate.convertAndSend("/topic/solicitudes/" + solicitudId, evento);
    }

    public void publicarNotificacion(Long usuarioId, NotificacionEvent evento) {
        messagingTemplate.convertAndSend("/topic/notificaciones/" + usuarioId, evento);
    }
}