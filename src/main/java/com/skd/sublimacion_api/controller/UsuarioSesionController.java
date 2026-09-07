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
 * Gestión de dispositivos para cualquier usuario autenticado (cliente, admin).
 * Permite ver y cerrar sesiones de la cuenta propia.
 */
@RestController
@RequestMapping("/api/usuario/sesiones")
@RequiredArgsConstructor
public class UsuarioSesionController {

    private final SesionActivaService sesionActivaService;
    private final JwtService jwtService;

    @GetMapping
    public List<SesionActivaResponse> listar(
            @AuthenticationPrincipal Usuario usuario,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return sesionActivaService.listarDe(usuario.getId(), jtiActual(authHeader));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> revocar(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long id) {
        sesionActivaService.revocarSesionDe(usuario.getId(), id);
        return ResponseEntity.ok(Map.of("cerrada", true));
    }

    @DeleteMapping("/otras")
    public ResponseEntity<Map<String, Object>> revocarOtras(
            @AuthenticationPrincipal Usuario usuario,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        int cerradas = sesionActivaService.revocarTodasMenos(usuario.getId(), jtiActual(authHeader));
        return ResponseEntity.ok(Map.of("cerradas", cerradas));
    }

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
