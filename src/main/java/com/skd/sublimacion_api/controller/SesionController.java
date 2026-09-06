package com.skd.sublimacion_api.controller;

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
 * Control de dispositivos conectados de la cuenta del cliente (Dashboard ->
 * Seguridad -> Dispositivos conectados). Permite ver desde qué dispositivos hay
 * sesión abierta y cerrarlas remotamente.
 */
@RestController
@RequestMapping("/api/cuenta/sesiones")
@RequiredArgsConstructor
public class SesionController {

    private final SesionActivaService sesionActivaService;
    private final JwtService jwtService;

    /** Lista las sesiones activas de la cuenta, marcando la del dispositivo actual. */
    @GetMapping
    public List<SesionActivaResponse> listar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        return sesionActivaService.listarDe(usuario.getId(), jtiActual(authHeader));
    }

    /** Cierra la sesión de otro dispositivo (no permite cerrar el actual aquí). */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> revocar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long id) {

        sesionActivaService.revocarSesionDe(usuario.getId(), id);
        return ResponseEntity.ok(Map.of("cerrada", true));
    }

    /** Cierra todas las sesiones excepto la del dispositivo actual. */
    @DeleteMapping("/otras")
    public ResponseEntity<Map<String, Object>> revocarOtras(
            @AuthenticationPrincipal Usuario usuario,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        int cerradas = sesionActivaService.revocarTodasMenos(usuario.getId(), jtiActual(authHeader));
        return ResponseEntity.ok(Map.of("cerradas", cerradas));
    }

    /** Cierra la sesión del dispositivo actual (logout desde el panel). */
    @DeleteMapping("/actual")
    public ResponseEntity<Map<String, Object>> revocarActual(
            @AuthenticationPrincipal Usuario usuario,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        sesionActivaService.revocarSesionActualDe(usuario.getId(), jtiActual(authHeader));
        return ResponseEntity.ok(Map.of("cerrada", true));
    }

    private String jtiActual(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        return jwtService.extractTokenId(authHeader.substring(7));
    }
}
