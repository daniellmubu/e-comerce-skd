package com.skd.sublimacion_api.controller.admin;

import com.skd.sublimacion_api.dto.producto.ProductoResponse;
import com.skd.sublimacion_api.service.admin.AdminProductoService;
import lombok.RequiredArgsConstructor;
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
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {

        return adminProductoService.listar(pageable);
    }

}