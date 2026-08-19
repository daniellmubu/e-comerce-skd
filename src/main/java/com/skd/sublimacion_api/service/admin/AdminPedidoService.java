package com.skd.sublimacion_api.service.admin;

import com.skd.sublimacion_api.dto.pedido.PedidoResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminPedidoService {

    Page<PedidoResponse> listar(String estado, Long usuarioId, Pageable pageable);

    PedidoResponse obtenerPorId(Long id);

    PedidoResponse cambiarEstado(Long id, String estado);
}
