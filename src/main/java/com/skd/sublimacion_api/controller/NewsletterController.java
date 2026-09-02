package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.service.NewsletterService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/newsletter")
@RequiredArgsConstructor
public class NewsletterController {

    private final NewsletterService newsletterService;

    @Data
    public static class SuscripcionRequest {
        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no tiene un formato válido")
        private String correo;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> suscribir(@Valid @RequestBody SuscripcionRequest request) {

        newsletterService.suscribir(request.getCorreo().trim().toLowerCase());

        return ResponseEntity.ok(Map.of(
                "message", "¡Gracias por suscribirte! Recibirás nuestras novedades."));
    }
}
