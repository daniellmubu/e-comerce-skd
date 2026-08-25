package com.skd.sublimacion_api.mapper;

import org.springframework.stereotype.Component;

import com.skd.sublimacion_api.dto.producto.ProductoResponse;
import com.skd.sublimacion_api.entity.ImagenProducto;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.repository.ImagenProductoRepository;

import lombok.RequiredArgsConstructor;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ProductoMapper {

    private final ImagenProductoRepository imagenProductoRepository;

    public ProductoResponse toResponse(Producto producto){

        if(producto == null){
            return null;
        }

        List<ImagenProducto> imagenes = imagenProductoRepository.findByProductoId(producto.getId());
        String imagenUrl = null;
        if (!imagenes.isEmpty()) {
            imagenUrl = imagenes.stream()
                    .filter(i -> Boolean.TRUE.equals(i.getEsPrincipal()))
                    .findFirst()
                    .orElse(imagenes.get(0))
                    .getUrl();
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
                .imagenUrl(imagenUrl)
                .build();

    }

}