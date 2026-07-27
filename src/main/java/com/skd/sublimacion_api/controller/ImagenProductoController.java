package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.imagen.ImagenProductoRequest;
import com.skd.sublimacion_api.dto.imagen.ImagenProductoResponse;
import com.skd.sublimacion_api.service.ImagenProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/imagenes")
@RequiredArgsConstructor
public class ImagenProductoController {

    private final ImagenProductoService imagenService;

    @GetMapping
    public List<ImagenProductoResponse> listar() {
        return imagenService.listar();
    }

    @GetMapping("/{id}")
    public ImagenProductoResponse obtenerPorId(@PathVariable Long id) {
        return imagenService.obtenerPorId(id);
    }

    @GetMapping("/producto/{productoId}")
    public List<ImagenProductoResponse> obtenerPorProducto(@PathVariable Long productoId) {
        return imagenService.obtenerPorProducto(productoId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ImagenProductoResponse guardar(@Valid @RequestBody ImagenProductoRequest request) {
        return imagenService.guardar(request);
    }

    @PutMapping("/{id}")
    public ImagenProductoResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ImagenProductoRequest request) {

        return imagenService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        imagenService.eliminar(id);
    }
}