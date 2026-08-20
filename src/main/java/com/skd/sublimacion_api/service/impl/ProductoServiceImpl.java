package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.repository.ResenaRepository;
import com.skd.sublimacion_api.service.ProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.CategoriaRepository;
import com.skd.sublimacion_api.dto.producto.ProductoRequest;
import com.skd.sublimacion_api.dto.producto.ProductoResponse;
import com.skd.sublimacion_api.entity.Categoria;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductoServiceImpl implements ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final ResenaRepository resenaRepository;

    @Override
    public List<ProductoResponse> listar() {

        ResumenResenas resumen = obtenerResumenResenas();

        return productoRepository.findByActivoTrue()
            .stream()
            .map(producto -> convertir(producto, resumen))
            .toList();
    }
    @Override
    public ProductoResponse guardar(ProductoRequest request) {

    Categoria categoria = categoriaRepository.findById(request.getCategoriaId())
            .orElseThrow(() ->
                    new ResourceNotFoundException(
                            "Categoría no encontrada con id: " + request.getCategoriaId()));

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

    return convertir(guardado, obtenerResumenResenas());
    }

    @Override
    public ProductoResponse actualizar(Long id, ProductoRequest request) {

        Producto producto = productoRepository.findById(id)
            .orElseThrow(() ->
                    new ResourceNotFoundException("Producto no encontrado con id: " + id));

        Categoria categoria = categoriaRepository.findById(request.getCategoriaId())
            .orElseThrow(() ->
                    new ResourceNotFoundException("Categoría no encontrada con id: " + request.getCategoriaId()));

        producto.setNombre(request.getNombre());
        producto.setDescripcion(request.getDescripcion());
        producto.setPrecio(request.getPrecio());
        producto.setStock(request.getStock());
        producto.setActivo(request.getActivo());
        producto.setMasVendido(request.getMasVendido());
        producto.setCategoria(categoria);

        Producto actualizado = productoRepository.save(producto);

        return convertir(actualizado, obtenerResumenResenas());
    }
    

    @Override
    public void eliminar(Long id) {

        Producto producto = productoRepository.findById(id)
            .orElseThrow(() ->
                    new ResourceNotFoundException("Producto no encontrado con id: " + id));

        productoRepository.delete(producto);
    }

    @Override
    public List<ProductoResponse> buscarPorNombre(String nombre) {

        ResumenResenas resumen = obtenerResumenResenas();

        return productoRepository.findByNombreContainingIgnoreCase(nombre)
            .stream()
            .map(producto -> convertir(producto, resumen))
            .toList();
    }

    @Override
    public List<ProductoResponse> buscarPorCategoria(Long categoriaId) {

        ResumenResenas resumen = obtenerResumenResenas();

        return productoRepository.findByCategoriaId(categoriaId)
        .stream()
        .map(producto -> convertir(producto, resumen))
        .toList();
    }
    @Override
    public ProductoResponse obtenerPorId(Long id) {

        Producto producto = productoRepository.findById(id)
            .orElseThrow(() ->
                    new ResourceNotFoundException("Producto no encontrado con id: " + id));

        return convertir(producto, obtenerResumenResenas());
    }

    private record ResumenResenas(
            Map<Long, Double> promedios,
            Map<Long, Long> conteos) {}

    // Una sola consulta agregada para todo el catálogo:
    // SELECT producto_id, AVG(calificacion), COUNT(*) FROM resena GROUP BY producto_id
    private ResumenResenas obtenerResumenResenas() {

        Map<Long, Double> promedios = new HashMap<>();
        Map<Long, Long> conteos = new HashMap<>();

        for (Object[] fila : resenaRepository.promedioYConteoPorProducto()) {

            Long productoId = ((Number) fila[0]).longValue();
            promedios.put(productoId, ((Number) fila[1]).doubleValue());
            conteos.put(productoId, ((Number) fila[2]).longValue());
        }

        return new ResumenResenas(promedios, conteos);
    }

    private ProductoResponse convertir(
            Producto producto,
            ResumenResenas resumen) {

        return ProductoResponse.builder()
                .id(producto.getId())
                .nombre(producto.getNombre())
                .descripcion(producto.getDescripcion())
                .precio(producto.getPrecio())
                .stock(producto.getStock())
                .activo(producto.getActivo())
                .masVendido(producto.getMasVendido())
                .categoria(producto.getCategoria().getNombre())
                .promedioCalificacion(
                        resumen.promedios.getOrDefault(producto.getId(), 0.0))
                .cantidadResenas(
                        resumen.conteos.getOrDefault(producto.getId(), 0L))
                .build();
    }
}