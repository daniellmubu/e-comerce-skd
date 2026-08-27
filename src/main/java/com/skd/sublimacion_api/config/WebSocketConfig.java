package com.skd.sublimacion_api.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configuración STOMP sobre WebSocket.
 *
 * Endpoint: /ws (con SockJS como fallback)
 * Broker de mensajes: /topic (destinos de broadcast)
 * Prefijo de mensajes de la app: /app
 *
 * AUTENTICACIÓN: el cliente debe conectarse enviando en el frame CONNECT de
 * STOMP el header "Authorization: Bearer <jwt>" (mismo JWT del flujo REST).
 * WebSocketAuthChannelInterceptor valida el token y, en el SUBSCRIBE a
 * /topic/pedidos/{pedidoId}, verifica que el usuario autenticado sea el dueño
 * del pedido.
 *
 * MENSAJE QUE RECIBE EL FRONTEND (Jeanpierre) al suscribirse a
 * /topic/pedidos/{pedidoId}:
 *
 * {
 *   "pedidoId": 12,
 *   "estado": "enviado",
 *   "timestamp": "2026-08-19T14:30:00.123"
 * }
 *
 * "estado" puede ser: recibido, disenando, imprimiendo, empacando, enviado,
 * entregado, cancelado.
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(
                        "http://localhost:3000",
                        "http://localhost:5173",
                        "http://127.0.0.1:5173"
                )
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthChannelInterceptor);
    }
}