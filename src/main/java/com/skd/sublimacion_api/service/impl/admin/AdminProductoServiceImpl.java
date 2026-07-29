package com.skd.sublimacion_api.service.impl.admin;

import com.skd.sublimacion_api.dto.producto.ProductoResponse;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.service.admin.AdminProductoService;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import org.springframework.data.jpa.domain.Specification;

import com.skd.sublimacion_api.specification.ProductoSpecification;

@Service
@RequiredArgsConstructor
public class AdminProductoServiceImpl implements AdminProductoService {

    private final ProductoRepository productoRepository;

    @Override
    public Page<ProductoResponse> listar(
        String nombre,
        Pageable pageable) {

    Specification<Producto> specification =
            Specification.where(
                    ProductoSpecification.nombreContiene(nombre)
            );

    return productoRepository
            .findAll(specification, pageable)
            .map(this::convertirResponse);


    }

    private ProductoResponse convertirResponse(Producto producto) {

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