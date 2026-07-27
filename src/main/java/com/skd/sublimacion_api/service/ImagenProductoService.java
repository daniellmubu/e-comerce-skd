package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.imagen.ImagenProductoRequest;
import com.skd.sublimacion_api.dto.imagen.ImagenProductoResponse;

import java.util.List;

public interface ImagenProductoService {

    List<ImagenProductoResponse> listar();

    ImagenProductoResponse obtenerPorId(Long id);

    List<ImagenProductoResponse> obtenerPorProducto(Long productoId);

    ImagenProductoResponse guardar(ImagenProductoRequest request);

    ImagenProductoResponse actualizar(Long id, ImagenProductoRequest request);

    void eliminar(Long id);

}