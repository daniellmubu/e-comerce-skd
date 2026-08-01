package com.skd.sublimacion_api.controller.admin;

import com.skd.sublimacion_api.dto.producto.ProductoResponse;
import com.skd.sublimacion_api.service.admin.AdminProductoService;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import com.skd.sublimacion_api.dto.producto.ProductoRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/admin/productos")
@RequiredArgsConstructor
public class AdminProductoController {

    private final AdminProductoService adminProductoService;

    @GetMapping
    public Page<ProductoResponse> listar(

            @RequestParam(required = false)
            String nombre,

            @RequestParam(required = false)
            Long categoriaId,

            @RequestParam(required = false)
            Boolean activo,

            @RequestParam(required = false)
            BigDecimal precioMin,

            @RequestParam(required = false)
            BigDecimal precioMax,

            @PageableDefault(size = 10, sort = "id")
            Pageable pageable
    ) {

        return adminProductoService.listar(
                nombre,
                categoriaId,
                activo,
                precioMin,
                precioMax,
                pageable
        );

    }

    @GetMapping("/{id}")
    public ProductoResponse obtenerPorId(
            @PathVariable Long id) {

        return adminProductoService.obtenerPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductoResponse guardar(
            @Valid @RequestBody ProductoRequest request) {

        return adminProductoService.guardar(request);
    }

    @PutMapping("/{id}")
    public ProductoResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ProductoRequest request) {

        return adminProductoService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        adminProductoService.eliminar(id);
    }

    @PatchMapping("/{id}/restaurar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void restaurar(@PathVariable Long id) {
        adminProductoService.restaurar(id);
    }

}