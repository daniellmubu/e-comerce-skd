package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.dto.notificacion.NotificacionResponse;
import com.skd.sublimacion_api.dto.websocket.NotificacionEvent;
import com.skd.sublimacion_api.entity.Notificacion;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.exeption.ForbiddenException;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.NotificacionRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.service.NotificacionService;
import com.skd.sublimacion_api.service.WebSocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificacionServiceImpl implements NotificacionService {

    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final WebSocketService webSocketService;

    @Override
    @Transactional
    public NotificacionResponse crear(Long usuarioId, String tipo, String titulo, String mensaje) {

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Notificacion notificacion = Notificacion.builder()
                .usuario(usuario)
                .tipo(tipo)
                .titulo(titulo)
                .mensaje(mensaje)
                .leida(false)
                .build();

        NotificacionResponse response = convertir(notificacionRepository.save(notificacion));

        webSocketService.publicarNotificacion(usuarioId, NotificacionEvent.builder()
                .notificacionId(response.getId())
                .tipo(response.getTipo())
                .titulo(response.getTitulo())
                .mensaje(response.getMensaje())
                .timestamp(LocalDateTime.now())
                .build());

        return response;
    }

    @Override
    public List<NotificacionResponse> listarMias(Long usuarioId) {

        return notificacionRepository.findByUsuarioIdOrderByCreadoEnDesc(usuarioId)
                .stream()
                .map(this::convertir)
                .toList();
    }

    @Override
    public long contarNoLeidas(Long usuarioId) {
        return notificacionRepository.countByUsuarioIdAndLeidaFalse(usuarioId);
    }

    @Override
    @Transactional
    public void marcarLeida(Long id, Long usuarioId) {

        Notificacion notificacion = notificacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notificación no encontrada con id: " + id));

        if (!notificacion.getUsuario().getId().equals(usuarioId)) {
            throw new ForbiddenException("La notificación no pertenece al usuario autenticado.");
        }

        notificacion.setLeida(true);
        notificacionRepository.save(notificacion);
    }

    @Override
    @Transactional
    public void marcarTodasLeidas(Long usuarioId) {

        List<Notificacion> pendientes = notificacionRepository
                .findByUsuarioIdOrderByCreadoEnDesc(usuarioId)
                .stream()
                .filter(n -> !Boolean.TRUE.equals(n.getLeida()))
                .toList();

        pendientes.forEach(n -> n.setLeida(true));
        notificacionRepository.saveAll(pendientes);
    }

    private NotificacionResponse convertir(Notificacion notificacion) {

        return NotificacionResponse.builder()
                .id(notificacion.getId())
                .tipo(notificacion.getTipo())
                .titulo(notificacion.getTitulo())
                .mensaje(notificacion.getMensaje())
                .leida(notificacion.getLeida())
                .creadoEn(notificacion.getCreadoEn())
                .build();
    }
}