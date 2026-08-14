package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.carrito.CarritoResponse;

import java.util.List;

public interface CarritoService {

    List<CarritoResponse> listar();

    CarritoResponse obtenerPorId(Long id);

    CarritoResponse obtenerPorUsuario(Long usuarioId);

    CarritoResponse guardar(Long usuarioId);

    void eliminar(Long id);

}