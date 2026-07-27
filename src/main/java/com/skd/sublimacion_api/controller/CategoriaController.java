package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.categoria.CategoriaRequest;
import com.skd.sublimacion_api.dto.categoria.CategoriaResponse;
import com.skd.sublimacion_api.service.CategoriaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
@RequiredArgsConstructor
public class CategoriaController {

    private final CategoriaService categoriaService;

    @GetMapping
    public List<CategoriaResponse> listar() {
        return categoriaService.listar();
    }

    @GetMapping("/{id}")
    public CategoriaResponse obtenerPorId(@PathVariable Long id) {
        return categoriaService.obtenerPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoriaResponse guardar(
            @Valid @RequestBody CategoriaRequest request) {

        return categoriaService.guardar(request);
    }

    @PutMapping("/{id}")
    public CategoriaResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody CategoriaRequest request) {

        return categoriaService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        categoriaService.eliminar(id);
    }
}