package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.AuthResponse;
import com.skd.sublimacion_api.dto.LoginRequest;
import com.skd.sublimacion_api.dto.OlvidePasswordRequest;
import com.skd.sublimacion_api.dto.RegistroRequest;
import com.skd.sublimacion_api.dto.RestablecerPasswordRequest;
import com.skd.sublimacion_api.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping("/registro")
    public ResponseEntity<AuthResponse> registrar(@Valid @RequestBody RegistroRequest request) {
        return ResponseEntity.ok(authenticationService.registrar(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authenticationService.login(request));
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