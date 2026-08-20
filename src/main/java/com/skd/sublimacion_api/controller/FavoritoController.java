package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.favorito.FavoritoListaResponse;
import com.skd.sublimacion_api.dto.favorito.FavoritoResponse;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.service.FavoritoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/favoritos")
@RequiredArgsConstructor
public class FavoritoController {

    private final FavoritoService favoritoService;

    @PostMapping("/{productoId}")
    public ResponseEntity<FavoritoResponse> agregar(
            @PathVariable Long productoId,
            @AuthenticationPrincipal Usuario usuario) {

        FavoritoService.FavoritoAgregado resultado =
                favoritoService.agregar(productoId, usuario.getId());

        HttpStatus estado = resultado.creado()
                ? HttpStatus.CREATED
                : HttpStatus.OK;

        return ResponseEntity.status(estado).body(resultado.favorito());
    }

    @DeleteMapping("/{productoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(
            @PathVariable Long productoId,
            @AuthenticationPrincipal Usuario usuario) {

        favoritoService.eliminar(productoId, usuario.getId());
    }

    @GetMapping("/mios")
    public FavoritoListaResponse listarMios(
            @AuthenticationPrincipal Usuario usuario,
            @PageableDefault(size = 10, sort = "agregadoEn",
                    direction = Sort.Direction.DESC)
            Pageable pageable) {

        return favoritoService.listarMios(usuario.getId(), pageable);
    }
}