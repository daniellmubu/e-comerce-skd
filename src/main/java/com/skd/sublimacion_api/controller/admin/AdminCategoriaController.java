package com.skd.sublimacion_api.controller.admin;

import com.skd.sublimacion_api.dto.categoria.CategoriaRequest;
import com.skd.sublimacion_api.dto.categoria.CategoriaResponse;
import com.skd.sublimacion_api.service.admin.AdminCategoriaService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/admin/categorias")
@RequiredArgsConstructor
public class AdminCategoriaController {

    private final AdminCategoriaService adminCategoriaService;

    @GetMapping
    public Page<CategoriaResponse> listar(
            @PageableDefault(size = 10, sort = "id")
            Pageable pageable) {

        return adminCategoriaService.listar(pageable);
    }

    @GetMapping("/{id}")
    public CategoriaResponse obtenerPorId(
            @PathVariable Long id) {

        return adminCategoriaService.obtenerPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoriaResponse guardar(
            @Valid @RequestBody CategoriaRequest request) {

        return adminCategoriaService.guardar(request);
    }

    @PutMapping("/{id}")
    public CategoriaResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody CategoriaRequest request) {

        return adminCategoriaService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {

        adminCategoriaService.eliminar(id);
    }
}