package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.producto.ProductoBusquedaRequest;
import com.skd.sublimacion_api.dto.producto.ProductoListaResponse;
import com.skd.sublimacion_api.dto.producto.ProductoRequest;
import com.skd.sublimacion_api.dto.producto.ProductoResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProductoService {

    List<ProductoResponse> listar(Long usuarioId);

    ProductoResponse obtenerPorId(Long id, Long usuarioId);

    ProductoResponse guardar(ProductoRequest request);

    ProductoResponse actualizar(Long id, ProductoRequest request);

    void eliminar(Long id);

    List<ProductoResponse> buscarPorCategoria(Long categoriaId, Long usuarioId);

    ProductoListaResponse buscar(
            ProductoBusquedaRequest filtros,
            Pageable pageable,
            Long usuarioId);
}