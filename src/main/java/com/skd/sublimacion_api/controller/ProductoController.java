package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.producto.ProductoRequest;
import com.skd.sublimacion_api.dto.producto.ProductoResponse;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.service.ProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;

    @GetMapping
    public List<ProductoResponse> listar(
            @AuthenticationPrincipal Usuario usuario) {

        return productoService.listar(idOpcional(usuario));
    }

    @GetMapping("/{id}")
    public ProductoResponse obtenerPorId(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario) {

        return productoService.obtenerPorId(id, idOpcional(usuario));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductoResponse guardar(@Valid @RequestBody ProductoRequest request) {
        return productoService.guardar(request);
    }
    @PutMapping("/{id}")
    public ProductoResponse actualizar(
        @PathVariable Long id,
        @Valid @RequestBody ProductoRequest request) {

    return productoService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        productoService.eliminar(id);
    }
    @GetMapping("/buscar")
    public List<ProductoResponse> buscarPorNombre(
        @RequestParam String nombre,
        @AuthenticationPrincipal Usuario usuario) {

    return productoService.buscarPorNombre(nombre, idOpcional(usuario));
    }

    @GetMapping("/categoria/{categoriaId}")
    public List<ProductoResponse> buscarPorCategoria(
        @PathVariable Long categoriaId,
        @AuthenticationPrincipal Usuario usuario) {

    return productoService.buscarPorCategoria(categoriaId, idOpcional(usuario));
    }

    // null para anónimos (el catálogo es público), el id para usuarios logueados.
    private Long idOpcional(Usuario usuario) {
        return usuario == null ? null : usuario.getId();
    }
}