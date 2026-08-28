package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.referido.ReferidoInfoResponse;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.service.ReferidoService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/referidos")
@RequiredArgsConstructor
@Tag(name = "Referidos", description = "Programa de referidos.")
public class ReferidoController {

    private final ReferidoService referidoService;

    @Operation(summary = "Mi código de referido", description = "Devuelve el código único del usuario autenticado y estadísticas.")
    @GetMapping("/mi-codigo")
    public ReferidoInfoResponse miCodigo(@AuthenticationPrincipal Usuario usuario) {
        return referidoService.miCodigo(usuario.getId());
    }
}