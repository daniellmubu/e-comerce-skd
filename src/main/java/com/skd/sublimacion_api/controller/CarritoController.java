package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.carrito.CarritoResponse;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.service.CarritoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/carritos")
@RequiredArgsConstructor
public class CarritoController {

    private final CarritoService carritoService;

    @GetMapping("/{id}")
    public CarritoResponse obtener(@PathVariable Long id,
                                   @AuthenticationPrincipal Usuario usuario){
        return carritoService.obtenerPorId(id, usuario.getId());
    }

    @GetMapping("/usuario")
    public CarritoResponse obtenerPorUsuario(@AuthenticationPrincipal Usuario usuario){
        return carritoService.obtenerPorUsuario(usuario.getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CarritoResponse guardar(@AuthenticationPrincipal Usuario usuario){
        return carritoService.guardar(usuario.getId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id,
                         @AuthenticationPrincipal Usuario usuario){
        carritoService.eliminar(id, usuario.getId());
    }

}