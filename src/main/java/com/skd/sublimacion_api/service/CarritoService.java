package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.carrito.CarritoRequest;
import com.skd.sublimacion_api.dto.carrito.CarritoResponse;

import java.util.List;

public interface CarritoService {

    List<CarritoResponse> listar();

    CarritoResponse obtenerPorId(Long id);

    CarritoResponse obtenerPorUsuario(Long usuarioId);

    CarritoResponse guardar(CarritoRequest request);

    void eliminar(Long id);

}