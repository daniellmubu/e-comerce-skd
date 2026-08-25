package com.skd.sublimacion_api.service.impl.admin;

import com.skd.sublimacion_api.dto.producto.ProductoResponse;
import com.skd.sublimacion_api.entity.ImagenProducto;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.repository.CategoriaRepository;
import com.skd.sublimacion_api.repository.ImagenProductoRepository;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.service.SupabaseStorageService;
import com.skd.sublimacion_api.service.admin.AdminProductoService;

import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        private final ImagenProductoRepository imagenRepository;
        private final SupabaseStorageService supabaseStorageService;

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

        @Override
        @Transactional
        public int ajustarPrecioPorPorcentaje(List<Long> ids, BigDecimal porcentaje) {

                if (ids == null || ids.isEmpty()) {
                        throw new IllegalArgumentException(
                                "Debe seleccionar al menos un producto");
                }

                if (porcentaje == null) {
                        throw new IllegalArgumentException(
                                "El porcentaje es obligatorio");
                }

                if (porcentaje.compareTo(BigDecimal.valueOf(-100)) < 0) {
                        throw new IllegalArgumentException(
                                "El porcentaje no puede ser menor a -100");
                }

                List<Producto> productos = productoRepository.findAllById(ids);

                if (productos.isEmpty()) {
                        throw new ResourceNotFoundException(
                                "No se encontraron productos con los ids seleccionados");
                }

                BigDecimal factor = BigDecimal.ONE
                        .add(porcentaje.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP));

                for (Producto producto : productos) {
                        BigDecimal nuevoPrecio = producto.getPrecio()
                                .multiply(factor)
                                .setScale(2, RoundingMode.HALF_UP);
                        producto.setPrecio(nuevoPrecio);
                }

                productoRepository.saveAll(productos);

                return productos.size();
        }

        @Override
        @Transactional
        public ProductoResponse subirImagen(Long productoId, byte[] imagenBytes, String contentType, String nombreOriginal) {

                Producto producto = buscarProducto(productoId);

                String extension = extensionDe(nombreOriginal, contentType);
                String url = supabaseStorageService.subirImagen(imagenBytes, extension, contentType);

                List<ImagenProducto> existentes = imagenRepository.findByProductoId(productoId);
                ImagenProducto imagen;
                if (existentes.isEmpty()) {
                        imagen = ImagenProducto.builder()
                                .producto(producto)
                                .url(url)
                                .esPrincipal(true)
                                .build();
                } else {
                        imagen = existentes.get(0);
                        imagen.setUrl(url);
                        imagen.setEsPrincipal(true);
                }

                imagenRepository.save(imagen);

                return productoMapper.toResponse(producto);
        }

        private String extensionDe(String nombreOriginal, String contentType) {

                if (nombreOriginal != null) {
                        int idx = nombreOriginal.lastIndexOf('.');
                        if (idx >= 0 && idx < nombreOriginal.length() - 1) {
                                return nombreOriginal.substring(idx);
                        }
                }

                if (contentType != null) {
                        String tipo = contentType.toLowerCase(Locale.ROOT);
                        if (tipo.contains("png")) return ".png";
                        if (tipo.contains("webp")) return ".webp";
                        if (tipo.contains("gif")) return ".gif";
                        if (tipo.contains("jpeg") || tipo.contains("jpg")) return ".jpg";
                }

                return ".jpg";
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