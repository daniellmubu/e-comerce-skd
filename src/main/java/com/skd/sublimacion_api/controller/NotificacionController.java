package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.notificacion.NotificacionResponse;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionService notificacionService;

    @GetMapping
    public List<NotificacionResponse> listar(@AuthenticationPrincipal Usuario usuario) {
        return notificacionService.listarMias(usuario.getId());
    }

    @GetMapping("/no-leidas")
    public long contarNoLeidas(@AuthenticationPrincipal Usuario usuario) {
        return notificacionService.contarNoLeidas(usuario.getId());
    }

    @PatchMapping("/{id}/leida")
    public void marcarLeida(@PathVariable Long id,
                            @AuthenticationPrincipal Usuario usuario) {
        notificacionService.marcarLeida(id, usuario.getId());
    }

    @PatchMapping("/leidas")
    public void marcarTodasLeidas(@AuthenticationPrincipal Usuario usuario) {
        notificacionService.marcarTodasLeidas(usuario.getId());
    }
}