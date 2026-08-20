package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.producto.ProductoRequest;
import com.skd.sublimacion_api.dto.producto.ProductoResponse;

import java.util.List;

public interface ProductoService {

    List<ProductoResponse> listar(Long usuarioId);

    ProductoResponse obtenerPorId(Long id, Long usuarioId);

    ProductoResponse guardar(ProductoRequest request);

    ProductoResponse actualizar(Long id, ProductoRequest request);

    void eliminar(Long id);

    List<ProductoResponse> buscarPorNombre(String nombre, Long usuarioId);

    List<ProductoResponse> buscarPorCategoria(Long categoriaId, Long usuarioId);
}