package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.carrito.CarritoResponse;

public interface CarritoService {

    CarritoResponse obtenerPorId(Long id, Long usuarioId);

    CarritoResponse obtenerPorUsuario(Long usuarioId);

    CarritoResponse guardar(Long usuarioId);

    void eliminar(Long id, Long usuarioId);

}