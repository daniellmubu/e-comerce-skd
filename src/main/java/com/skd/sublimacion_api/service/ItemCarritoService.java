package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.detallecarrito.ItemCarritoRequest;
import com.skd.sublimacion_api.dto.detallecarrito.ItemCarritoResponse;

import java.util.List;

public interface ItemCarritoService {

    List<ItemCarritoResponse> listar();

    ItemCarritoResponse obtenerPorId(Long id);

    ItemCarritoResponse guardar(ItemCarritoRequest request);

    void eliminar(Long id);

    List<ItemCarritoResponse> listarPorCarrito(Long carritoId);

}