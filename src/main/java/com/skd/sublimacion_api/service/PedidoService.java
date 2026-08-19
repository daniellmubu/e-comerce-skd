package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.pedido.PedidoRequest;
import com.skd.sublimacion_api.dto.pedido.PedidoResponse;

import java.util.List;

public interface PedidoService {

    PedidoResponse obtenerPorId(Long id, Long usuarioId);

    List<PedidoResponse> listarPorUsuario(Long usuarioId);

    PedidoResponse guardar(PedidoRequest request, Long usuarioId);

    void eliminar(Long id, Long usuarioId);

}