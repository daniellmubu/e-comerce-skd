package com.skd.sublimacion_api.service.admin;

import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.skd.sublimacion_api.dto.producto.ProductoResponse;

public interface AdminProductoService {

    Page<ProductoResponse> listar(
        String nombre,
        Long categoriaId,
        Boolean activo,
        BigDecimal precioMin,
        BigDecimal precioMax,
        Pageable pageable
);
void eliminar(Long id);
}