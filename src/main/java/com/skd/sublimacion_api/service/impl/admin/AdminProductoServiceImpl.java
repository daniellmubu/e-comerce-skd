package com.skd.sublimacion_api.service.impl.admin;

import com.skd.sublimacion_api.dto.producto.ProductoResponse;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.service.admin.AdminProductoService;

import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import org.springframework.data.jpa.domain.Specification;

import com.skd.sublimacion_api.specification.ProductoSpecification;
import com.skd.sublimacion_api.mapper.ProductoMapper;


import com.skd.sublimacion_api.exeption.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
public class AdminProductoServiceImpl implements AdminProductoService {

        private final ProductoRepository productoRepository;
        private final ProductoMapper productoMapper;

        @Override
        public Page<ProductoResponse> listar(
                String nombre,
                Long categoriaId,
                Boolean activo,
                BigDecimal precioMin,
                BigDecimal precioMax,
                Pageable pageable) {

        Specification<Producto> specification = Specification
                .where(ProductoSpecification.nombreContiene(nombre))
                .and(ProductoSpecification.categoriaEs(categoriaId))
                .and(ProductoSpecification.activoEs(activo))
                .and(ProductoSpecification.precioMayorIgual(precioMin))
                .and(ProductoSpecification.precioMenorIgual(precioMax));

        return productoRepository
                .findAll(specification, pageable)
                .map(productoMapper::toResponse);
        }


        public void eliminar(Long id) {

        Producto producto = productoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Producto no encontrado con id: " + id));

        producto.setActivo(false);

        productoRepository.save(producto);

}