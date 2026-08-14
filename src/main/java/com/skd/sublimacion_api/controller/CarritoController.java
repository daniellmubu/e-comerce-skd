package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.carrito.CarritoResponse;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.service.CarritoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/carritos")
@RequiredArgsConstructor
public class CarritoController {

    private final CarritoService carritoService;

    @GetMapping
    public List<CarritoResponse> listar(){
        return carritoService.listar();
    }

    @GetMapping("/{id}")
    public CarritoResponse obtener(@PathVariable Long id){
        return carritoService.obtenerPorId(id);
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
    public void eliminar(@PathVariable Long id){
        carritoService.eliminar(id);
    }

}