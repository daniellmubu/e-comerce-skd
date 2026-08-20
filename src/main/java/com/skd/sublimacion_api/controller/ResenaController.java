package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.resena.ResenaListaResponse;
import com.skd.sublimacion_api.dto.resena.ResenaRequest;
import com.skd.sublimacion_api.dto.resena.ResenaResponse;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.service.ResenaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/resenas")
@RequiredArgsConstructor
public class ResenaController {

    private final ResenaService resenaService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResenaResponse crear(
            @Valid @RequestBody ResenaRequest request,
            @AuthenticationPrincipal Usuario usuario) {

        return resenaService.crear(request, usuario.getId());
    }

    @GetMapping("/producto/{productoId}")
    public ResenaListaResponse listarPorProducto(
            @PathVariable Long productoId,
            @PageableDefault(size = 5, sort = "creadoEn",
                    direction = Sort.Direction.DESC)
            Pageable pageable) {

        return resenaService.listarPorProducto(productoId, pageable);
    }
}