package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.AuthResponse;
import com.skd.sublimacion_api.dto.CambiarPasswordRequest;
import com.skd.sublimacion_api.dto.LoginRequest;
import com.skd.sublimacion_api.dto.OlvidePasswordRequest;
import com.skd.sublimacion_api.dto.RegistroRequest;
import com.skd.sublimacion_api.dto.RestablecerPasswordRequest;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.security.JwtService;
import com.skd.sublimacion_api.service.AuthenticationService;
import com.skd.sublimacion_api.service.SesionActivaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final SesionActivaService sesionActivaService;
    private final JwtService jwtService;

    @PostMapping("/enviar-codigo-registro")
    public ResponseEntity<Map<String, String>> enviarCodigoRegistro(
            @Valid @RequestBody OlvidePasswordRequest request) {

        authenticationService.enviarCodigoRegistro(request.getCorreo());

        return ResponseEntity.ok(Map.of("message", "Revisa tu correo para el código de verificación"));
    }

    @PostMapping("/registro")
    public ResponseEntity<AuthResponse> registrar(
            @Valid @RequestBody RegistroRequest request,
            HttpServletRequest httpRequest) {

        AuthResponse respuesta = authenticationService.registrar(request);
        registrarSesionActiva(respuesta, httpRequest);
        return ResponseEntity.ok(respuesta);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        AuthResponse respuesta = authenticationService.login(request);

        // Registra la sesión activa del dispositivo que inicia sesión (para el
        // control de dispositivos conectados y el cierre remoto de sesiones).
        registrarSesionActiva(respuesta, httpRequest);

        return ResponseEntity.ok(respuesta);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            sesionActivaService.revocarPorJti(jwtService.extractTokenId(token));
        }
        return ResponseEntity.ok(Map.of("message", "Sesión cerrada"));
    }

    /** Registra la sesión activa del token de acceso recién emitido. */
    private void registrarSesionActiva(AuthResponse respuesta, HttpServletRequest httpRequest) {
        if (respuesta == null || respuesta.getToken() == null || respuesta.getToken().isBlank()) {
            return;
        }
        sesionActivaService.registrarSesion(
                respuesta.getId(),
                respuesta.getToken(),
                httpRequest.getHeader("User-Agent"),
                obtenerIpCliente(httpRequest));
    }

    /** Devuelve la IP real del cliente (respeta proxies con X-Forwarded-For). */
    private String obtenerIpCliente(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @PostMapping("/verificar-password")
    public ResponseEntity<Map<String, String>> verificarPassword(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody Map<String, String> body) {

        authenticationService.verificarPasswordActual(usuario.getId(), body.get("passwordActual"));

        return ResponseEntity.ok(Map.of("message", "Contraseña verificada"));
    }

    @PostMapping("/cambiar-password")
    public ResponseEntity<Map<String, String>> cambiarPassword(
            @AuthenticationPrincipal Usuario usuario,
            @Valid @RequestBody CambiarPasswordRequest request) {

        authenticationService.cambiarPassword(
                usuario.getId(), request.getPasswordActual(), request.getNuevaPassword());

        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada correctamente"));
    }

    @PostMapping("/olvide-password")
    public ResponseEntity<Map<String, String>> olvidarPassword(
            @Valid @RequestBody OlvidePasswordRequest request) {

        authenticationService.olvidarPassword(request.getCorreo());

        return ResponseEntity.ok(Map.of(
                "message",
                "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña"));
    }

    @PostMapping("/restablecer-password")
    public ResponseEntity<Map<String, String>> restablecerPassword(
            @Valid @RequestBody RestablecerPasswordRequest request) {

        authenticationService.restablecerPassword(request.getToken(), request.getPassword());

        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada correctamente"));
    }

    @PostMapping("/verificar-email")
    public ResponseEntity<Map<String, String>> verificarEmail(
            @RequestBody Map<String, String> body) {

        authenticationService.verificarEmail(body.get("token"));

        return ResponseEntity.ok(Map.of("message", "Correo verificado correctamente"));
    }

    @PostMapping("/reenviar-verificacion")
    public ResponseEntity<Map<String, String>> reenviarVerificacion(
            @Valid @RequestBody OlvidePasswordRequest request) {

        authenticationService.reenviarVerificacion(request.getCorreo());

        return ResponseEntity.ok(Map.of(
                "message",
                "Si el correo está registrado, recibirás un enlace para verificar tu cuenta"));
    }
}