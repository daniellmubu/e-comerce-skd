package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.detallecarrito.ItemCarritoRequest;
import com.skd.sublimacion_api.dto.detallecarrito.ItemCarritoResponse;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.service.ItemCarritoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;

@RestController
@RequestMapping("/api/detalle-carrito")
@RequiredArgsConstructor
public class DetalleCarritoController {

    private final ItemCarritoService detalleService;

    @GetMapping("/{id}")
    public ItemCarritoResponse obtener(@PathVariable Long id) {
        return detalleService.obtenerPorId(id);
    }

    @GetMapping("/carrito/{carritoId}")
    public List<ItemCarritoResponse> listarPorCarrito(@PathVariable Long carritoId) {
        return detalleService.listarPorCarrito(carritoId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ItemCarritoResponse guardar(@Valid @RequestBody ItemCarritoRequest request,
                                        @AuthenticationPrincipal Usuario usuario) {
        return detalleService.guardar(request, usuario.getId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        detalleService.eliminar(id);
    }
}