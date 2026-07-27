package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.dto.imagen.ImagenProductoRequest;
import com.skd.sublimacion_api.dto.imagen.ImagenProductoResponse;
import com.skd.sublimacion_api.entity.ImagenProducto;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.ImagenProductoRepository;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.service.ImagenProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ImagenProductoServiceImpl implements ImagenProductoService {

    private final ImagenProductoRepository imagenRepository;
    private final ProductoRepository productoRepository;

    @Override
    public List<ImagenProductoResponse> listar() {
        return imagenRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ImagenProductoResponse obtenerPorId(Long id) {

        ImagenProducto imagen = imagenRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Imagen no encontrada"));

        return toResponse(imagen);
    }

    @Override
    public List<ImagenProductoResponse> obtenerPorProducto(Long productoId) {

        return imagenRepository.findByProductoId(productoId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ImagenProductoResponse guardar(ImagenProductoRequest request) {

        Producto producto = productoRepository.findById(request.getProductoId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Producto no encontrado"));

        ImagenProducto imagen = ImagenProducto.builder()
                .producto(producto)
                .url(request.getUrl())
                .esPrincipal(request.getEsPrincipal())
                .build();

        return toResponse(imagenRepository.save(imagen));
    }

    @Override
    public ImagenProductoResponse actualizar(Long id, ImagenProductoRequest request) {

        ImagenProducto imagen = imagenRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Imagen no encontrada"));

        Producto producto = productoRepository.findById(request.getProductoId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Producto no encontrado"));

        imagen.setProducto(producto);
        imagen.setUrl(request.getUrl());
        imagen.setEsPrincipal(request.getEsPrincipal());

        return toResponse(imagenRepository.save(imagen));
    }

    @Override
    public void eliminar(Long id) {

        ImagenProducto imagen = imagenRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Imagen no encontrada"));

        imagenRepository.delete(imagen);
    }

    private ImagenProductoResponse toResponse(ImagenProducto imagen) {

        return ImagenProductoResponse.builder()
                .id(imagen.getId())
                .productoId(imagen.getProducto().getId())
                .url(imagen.getUrl())
                .esPrincipal(imagen.getEsPrincipal())
                .build();
    }
}