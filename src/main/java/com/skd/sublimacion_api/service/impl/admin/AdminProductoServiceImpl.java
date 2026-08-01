package com.skd.sublimacion_api.service.impl.admin;

import com.skd.sublimacion_api.dto.producto.ProductoResponse;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.repository.CategoriaRepository;
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


import com.skd.sublimacion_api.entity.Categoria;
import com.skd.sublimacion_api.dto.producto.ProductoRequest;

@Service
@RequiredArgsConstructor
public class AdminProductoServiceImpl implements AdminProductoService {

        private final ProductoRepository productoRepository;
        private final ProductoMapper productoMapper;
        private final CategoriaRepository categoriaRepository;

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
        
        @Override
        public ProductoResponse obtenerPorId(Long id) {

                Producto producto = productoRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Producto no encontrado con id: " + id));

                return productoMapper.toResponse(producto);
        }

        @Override
        public void eliminar(Long id) {

        Producto producto = productoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Producto no encontrado con id: " + id));

        producto.setActivo(false);

        productoRepository.save(producto);        

        }

        @Override
        public ProductoResponse guardar(ProductoRequest request) {

                Categoria categoria = categoriaRepository.findById(request.getCategoriaId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Categoría no encontrada con id: "
                                                + request.getCategoriaId()));

                Producto producto = Producto.builder()
                        .nombre(request.getNombre())
                        .descripcion(request.getDescripcion())
                        .precio(request.getPrecio())
                        .stock(request.getStock())
                        .activo(request.getActivo())
                        .masVendido(request.getMasVendido())
                        .categoria(categoria)
                        .build();

                Producto guardado = productoRepository.save(producto);

                return productoMapper.toResponse(guardado);
        }

        @Override
        public ProductoResponse actualizar(Long id, ProductoRequest request) {

        Producto producto = productoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Producto no encontrado con id: " + id));

        Categoria categoria = categoriaRepository.findById(request.getCategoriaId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Categoría no encontrada con id: "
                                        + request.getCategoriaId()));

        producto.setNombre(request.getNombre());
        producto.setDescripcion(request.getDescripcion());
        producto.setPrecio(request.getPrecio());
        producto.setStock(request.getStock());
        producto.setActivo(request.getActivo());
        producto.setMasVendido(request.getMasVendido());
        producto.setCategoria(categoria);

        Producto actualizado = productoRepository.save(producto);

        return productoMapper.toResponse(actualizado);
        }
        
        @Override
        public void restaurar(Long id) {

        Producto producto = productoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Producto no encontrado con id: " + id));

        producto.setActivo(true);

        productoRepository.save(producto);
        }
}