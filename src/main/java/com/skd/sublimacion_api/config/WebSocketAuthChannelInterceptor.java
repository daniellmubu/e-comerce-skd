package com.skd.sublimacion_api.config;

import com.skd.sublimacion_api.entity.Pedido;
import com.skd.sublimacion_api.entity.SolicitudDiseno;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.repository.PedidoRepository;
import com.skd.sublimacion_api.repository.SolicitudDisenoRepository;
import com.skd.sublimacion_api.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final PedidoRepository pedidoRepository;
    private final SolicitudDisenoRepository solicitudDisenoRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        switch (accessor.getCommand()) {
            case CONNECT -> autenticarConexion(accessor);
            case SUBSCRIBE -> validarSuscripcion(accessor);
            default -> {
            }
        }

        return message;
    }

    private void autenticarConexion(StompHeaderAccessor accessor) {

        String token = extraerToken(accessor);

        if (token == null) {
            throw new AccessDeniedException("Falta el token de autenticación");
        }

        String username = jwtService.extractUsername(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        if (!jwtService.isTokenValid(token, userDetails)) {
            throw new AccessDeniedException("Token inválido o expirado");
        }

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
        );
        accessor.setUser(auth);
    }

    private String extraerToken(StompHeaderAccessor accessor) {

        String authHeader = accessor.getFirstNativeHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        return accessor.getFirstNativeHeader("token");
    }

    private void validarSuscripcion(StompHeaderAccessor accessor) {

        String destino = accessor.getDestination();

        if (destino == null) {
            return;
        }

        Usuario usuario = usuarioAutenticado(accessor);

        if (destino.matches("^/topic/pedidos/\\d+$")) {
            Long pedidoId = Long.parseLong(destino.substring(destino.lastIndexOf('/') + 1));
            Pedido pedido = pedidoRepository.findById(pedidoId)
                    .orElseThrow(() -> new AccessDeniedException("El pedido no existe"));

            if (!pedido.getUsuario().getId().equals(usuario.getId())) {
                throw new AccessDeniedException("No tienes permiso para suscribirte a este pedido");
            }
            return;
        }

        if (destino.matches("^/topic/solicitudes/\\d+$")) {
            Long solicitudId = Long.parseLong(destino.substring(destino.lastIndexOf('/') + 1));
            SolicitudDiseno solicitud = solicitudDisenoRepository.findById(solicitudId)
                    .orElseThrow(() -> new AccessDeniedException("La solicitud no existe"));

            if (!solicitud.getUsuario().getId().equals(usuario.getId())) {
                throw new AccessDeniedException("No tienes permiso para suscribirte a esta solicitud");
            }
        }
    }

    private Usuario usuarioAutenticado(StompHeaderAccessor accessor) {
        if (!(accessor.getUser() instanceof UsernamePasswordAuthenticationToken auth)
                || !(auth.getPrincipal() instanceof Usuario usuario)) {
            throw new AccessDeniedException("Sesión no autenticada");
        }
        return usuario;
    }
}