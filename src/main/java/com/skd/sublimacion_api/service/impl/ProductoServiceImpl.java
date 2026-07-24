package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.service.ProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.CategoriaRepository;
import com.skd.sublimacion_api.dto.producto.ProductoRequest;
import com.skd.sublimacion_api.dto.producto.ProductoResponse;
import com.skd.sublimacion_api.entity.Categoria;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoServiceImpl implements ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;

    @Override
    public List<ProductoResponse> listar() {
        return productoRepository.findByActivoTrue()
            .stream()
            .map(producto -> ProductoResponse.builder()
                    .id(producto.getId())
                    .nombre(producto.getNombre())
                    .descripcion(producto.getDescripcion())
                    .precio(producto.getPrecio())
                    .stock(producto.getStock())
                    .activo(producto.getActivo())
                    .masVendido(producto.getMasVendido())
                    .categoria(producto.getCategoria().getNombre())
                    .build())
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

    return ProductoResponse.builder()
            .id(guardado.getId())
            .nombre(guardado.getNombre())
            .descripcion(guardado.getDescripcion())
            .precio(guardado.getPrecio())
            .stock(guardado.getStock())
            .activo(guardado.getActivo())
            .masVendido(guardado.getMasVendido())
            .categoria(guardado.getCategoria().getNombre())
            .build();
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

        return ProductoResponse.builder()
            .id(actualizado.getId())
            .nombre(actualizado.getNombre())
            .descripcion(actualizado.getDescripcion())
            .precio(actualizado.getPrecio())
            .stock(actualizado.getStock())
            .activo(actualizado.getActivo())
            .masVendido(actualizado.getMasVendido())
            .categoria(actualizado.getCategoria().getNombre())
            .build();
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
        return productoRepository.findByNombreContainingIgnoreCase(nombre)
            .stream()
            .map(producto -> ProductoResponse.builder()
                .id(producto.getId())
                .nombre(producto.getNombre())
                .descripcion(producto.getDescripcion())
                .precio(producto.getPrecio())
                .stock(producto.getStock())
                .activo(producto.getActivo())
                .masVendido(producto.getMasVendido())
                .categoria(producto.getCategoria().getNombre())
                .build())
            .toList();
    }

    @Override
    public List<ProductoResponse> buscarPorCategoria(Long categoriaId) {
        return productoRepository.findByCategoriaId(categoriaId)
        .stream()
        .map(producto -> ProductoResponse.builder()
                .id(producto.getId())
                .nombre(producto.getNombre())
                .descripcion(producto.getDescripcion())
                .precio(producto.getPrecio())
                .stock(producto.getStock())
                .activo(producto.getActivo())
                .masVendido(producto.getMasVendido())
                .categoria(producto.getCategoria().getNombre())
                .build())
        .toList();
    }
    @Override
    public ProductoResponse obtenerPorId(Long id) {

        Producto producto = productoRepository.findById(id)
            .orElseThrow(() ->
                    new ResourceNotFoundException("Producto no encontrado con id: " + id));

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