package com.skd.sublimacion_api.service.admin;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.skd.sublimacion_api.dto.producto.ProductoResponse;
import com.skd.sublimacion_api.dto.producto.ProductoRequest;


public interface AdminProductoService {

    Page<ProductoResponse> listar(
            String nombre,
            Long categoriaId,
            Boolean activo,
            BigDecimal precioMin,
            BigDecimal precioMax,
            Pageable pageable);

    ProductoResponse obtenerPorId(Long id);

    ProductoResponse guardar(ProductoRequest request);

    ProductoResponse actualizar(Long id, ProductoRequest request);

    void restaurar(Long id);

    void eliminar(Long id);

    int ajustarPrecioPorPorcentaje(List<Long> ids, BigDecimal porcentaje);

    ProductoResponse subirImagen(Long productoId, byte[] imagenBytes, String contentType, String nombreOriginal);

    /** Añade una imagen más a la galería del producto. La primera imagen subida queda como principal. */
    ProductoResponse agregarImagen(Long productoId, byte[] imagenBytes, String contentType, String nombreOriginal);

    /** Elimina una imagen de la galería. Si era la principal, promueve otra. */
    void eliminarImagen(Long imagenId);

    /** Marca una imagen como principal (desmarcando las demás del mismo producto). */
    void marcarImagenPrincipal(Long imagenId);
}