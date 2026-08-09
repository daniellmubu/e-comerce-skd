package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.diseno.DisenoRequest;
import com.skd.sublimacion_api.dto.diseno.DisenoResponse;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.service.DisenoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/disenos")
@RequiredArgsConstructor
public class DisenoController {

    private final DisenoService disenoService;

    @PostMapping("/generar")
    @ResponseStatus(HttpStatus.CREATED)
    public DisenoResponse generar(@RequestBody DisenoRequest request,
                                   @AuthenticationPrincipal Usuario usuario) {
        return disenoService.generar(request, usuario.getId());
    }

    @GetMapping("/usuario/{usuarioId}")
    public List<DisenoResponse> listarPorUsuario(@PathVariable Long usuarioId) {
        return disenoService.listarPorUsuario(usuarioId);
    }
}
