package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.envio.EnvioResponse;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.service.EnvioService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/envios")
@RequiredArgsConstructor
public class EnvioController {

    private final EnvioService envioService;

    @GetMapping("/calcular")
    public EnvioResponse calcular(
            @RequestParam Long direccionId,
            @AuthenticationPrincipal Usuario usuario) {

        return envioService.calcular(direccionId, usuario.getId());
    }
}