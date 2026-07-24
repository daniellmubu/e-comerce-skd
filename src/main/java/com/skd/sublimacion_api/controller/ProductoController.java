package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.producto.ProductoRequest;
import com.skd.sublimacion_api.dto.producto.ProductoResponse;
import com.skd.sublimacion_api.service.ProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;

    @GetMapping
    public List<ProductoResponse> listar() {
        return productoService.listar();
    }

    @GetMapping("/{id}")
    public ProductoResponse obtenerPorId(@PathVariable Long id) {
        return productoService.obtenerPorId(id);
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
    public List<ProductoResponse> buscarPorNombre(@RequestParam String nombre) {
    return productoService.buscarPorNombre(nombre);
    }

    @GetMapping("/categoria/{categoriaId}")
    public List<ProductoResponse> buscarPorCategoria(@PathVariable Long categoriaId) {
    return productoService.buscarPorCategoria(categoriaId);
    }

}