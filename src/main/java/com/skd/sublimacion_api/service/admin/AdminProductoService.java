package com.skd.sublimacion_api.service.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.skd.sublimacion_api.dto.producto.ProductoResponse;

public interface AdminProductoService {

    Page<ProductoResponse> listar(Pageable pageable);

}