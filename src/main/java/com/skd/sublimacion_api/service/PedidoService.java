package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.pedido.PedidoRequest;
import com.skd.sublimacion_api.dto.pedido.PedidoResponse;

import java.util.List;

public interface PedidoService {

    List<PedidoResponse> listar();

    PedidoResponse obtenerPorId(Long id);

    List<PedidoResponse> listarPorUsuario(Long usuarioId);

    PedidoResponse guardar(PedidoRequest request);

    void eliminar(Long id);

}