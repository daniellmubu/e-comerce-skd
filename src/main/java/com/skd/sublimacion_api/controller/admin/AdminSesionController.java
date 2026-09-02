package com.skd.sublimacion_api.controller.admin;

import com.skd.sublimacion_api.dto.sesion.SesionActivaResponse;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.security.JwtService;
import com.skd.sublimacion_api.service.SesionActivaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Control de sesiones activas del administrador (Seguridad).
 * Permite ver desde qué dispositivos hay sesión abierta y cerrarlas
 * de forma remota (seguridad para entornos ya desplegados).
 */
@RestController
@RequestMapping("/api/admin/sesiones")
@RequiredArgsConstructor
public class AdminSesionController {

    private final SesionActivaService sesionActivaService;
    private final JwtService jwtService;

    @GetMapping
    public List<SesionActivaResponse> listar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        return sesionActivaService.listarDe(usuario.getId(), jtiActual(authHeader));
    }

    /** Cierra una sesión concreta (de esta misma cuenta). */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> revocar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long id) {

        sesionActivaService.revocarSesionDe(usuario.getId(), id);
        return ResponseEntity.ok(Map.of("cerrada", true));
    }

    /** Cierra todas las sesiones de esta cuenta excepto la del dispositivo actual. */
    @DeleteMapping("/otras")
    public ResponseEntity<Map<String, Object>> revocarOtras(
            @AuthenticationPrincipal Usuario usuario,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        int cerradas = sesionActivaService.revocarTodasMenos(usuario.getId(), jtiActual(authHeader));
        return ResponseEntity.ok(Map.of("cerradas", cerradas));
    }

    /** Cierra la sesión actual (usado por el botón de cerrar sesión). */
    @DeleteMapping("/actual")
    public ResponseEntity<Map<String, Object>> revocarActual(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        sesionActivaService.revocarPorJti(jtiActual(authHeader));
        return ResponseEntity.ok(Map.of("cerrada", true));
    }

    private String jtiActual(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        return jwtService.extractTokenId(authHeader.substring(7));
    }
}
