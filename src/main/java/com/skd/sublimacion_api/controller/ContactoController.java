package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.ContactoRequest;
import com.skd.sublimacion_api.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/contacto")
@RequiredArgsConstructor
public class ContactoController {

    private final EmailService emailService;

    @PostMapping
    public ResponseEntity<Map<String, String>> enviar(@Valid @RequestBody ContactoRequest request) {

        emailService.enviarContacto(
                request.getNombre(),
                request.getCorreo(),
                request.getAsunto(),
                request.getMensaje());

        return ResponseEntity.ok(Map.of("message", "Mensaje enviado. Te responderemos pronto."));
    }
}