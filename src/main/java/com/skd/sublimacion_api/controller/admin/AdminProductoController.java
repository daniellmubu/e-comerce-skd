package com.skd.sublimacion_api.controller.admin;

import com.skd.sublimacion_api.dto.producto.ProductoResponse;
import com.skd.sublimacion_api.service.admin.AdminProductoService;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

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

}