package com.skd.sublimacion_api.mapper;

import com.skd.sublimacion_api.dto.producto.ProductoRequest;
import com.skd.sublimacion_api.dto.producto.ProductoResponse;
import com.skd.sublimacion_api.entity.Producto;

public class ProductoMapper {

    private ProductoMapper() {}

    public static ProductoResponse toResponse(Producto producto) {

        return ProductoResponse.builder()
                .id(producto.getId())
                .nombre(producto.getNombre())
                .descripcion(producto.getDescripcion())
                .precio(producto.getPrecio())
                .stock(producto.getStock())
                .activo(producto.getActivo())
                .masVendido(producto.getMasVendido())
                .categoria(producto.getCategoria().getNombre())
                .build();
    }

}