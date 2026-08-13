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
                return productoMapper.toResponse(buscarProducto(id));
        }

        @Override
        public void eliminar(Long id) {

                Producto producto = buscarProducto(id);

                producto.setActivo(false);

                productoRepository.save(producto);        

        }

        @Override
        public ProductoResponse guardar(ProductoRequest request) {

                validarNombreProducto(request.getNombre(), null);

                Categoria categoria = buscarCategoria(request.getCategoriaId());

                Producto producto = new Producto();

                actualizarDatosProducto(producto, request, categoria);

                Producto guardado = productoRepository.save(producto);

                return productoMapper.toResponse(guardado);
        }

        @Override
        public ProductoResponse actualizar(Long id, ProductoRequest request) {

                Producto producto = buscarProducto(id);

                Categoria categoria = buscarCategoria(request.getCategoriaId());

                actualizarDatosProducto(producto, request, categoria);

                Producto actualizado = productoRepository.save(producto);

                return productoMapper.toResponse(actualizado);
        }
        
        @Override
        public void restaurar(Long id) {

                Producto producto = buscarProducto(id);

                producto.setActivo(true);

                productoRepository.save(producto);
        }

        private Producto buscarProducto(Long id) {

                return productoRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Producto no encontrado con id: " + id));
        }

        private Categoria buscarCategoria(Long id) {

                return categoriaRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Categoría no encontrada con id: " + id));
        }

        private void validarNombreProducto(String nombre, Long idActual) {

                productoRepository.findByNombre(nombre)
                        .ifPresent(producto -> {

                                if (idActual == null || !producto.getId().equals(idActual)) {
                                throw new IllegalArgumentException(
                                        "Ya existe un producto con el nombre: " + nombre);
                                }

                        });
        }

        private void actualizarDatosProducto(
                Producto producto,
                ProductoRequest request,
                Categoria categoria) {

                producto.setNombre(request.getNombre());
                producto.setDescripcion(request.getDescripcion());
                producto.setPrecio(request.getPrecio());
                producto.setStock(request.getStock());
                producto.setActivo(request.getActivo());
                producto.setMasVendido(request.getMasVendido());
                producto.setCategoria(categoria);
        }
}