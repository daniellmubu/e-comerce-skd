package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.detallecarrito.ItemCarritoRequest;
import com.skd.sublimacion_api.dto.detallecarrito.ItemCarritoResponse;

import java.util.List;

public interface ItemCarritoService {

    ItemCarritoResponse obtenerPorId(Long id);

    ItemCarritoResponse guardar(ItemCarritoRequest request, Long usuarioId);

    ItemCarritoResponse actualizarCantidad(Long id, Integer nuevaCantidad, Long usuarioId);

    void eliminar(Long id);

    List<ItemCarritoResponse> listarPorCarrito(Long carritoId);

}