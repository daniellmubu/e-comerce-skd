package com.skd.sublimacion_api.mapper;

import org.springframework.stereotype.Component;

import com.skd.sublimacion_api.dto.producto.ProductoResponse;
import com.skd.sublimacion_api.entity.Producto;

@Component
public class ProductoMapper {

    public ProductoResponse toResponse(Producto producto){

        if(producto == null){
            return null;
        }

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