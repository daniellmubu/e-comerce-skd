package com.skd.sublimacion_api.service.impl;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;

import com.skd.sublimacion_api.dto.pedido.PedidoRequest;
import com.skd.sublimacion_api.dto.pedido.PedidoResponse;
import com.skd.sublimacion_api.entity.Pedido;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.PedidoRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.service.PedidoService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PedidoServiceImpl implements PedidoService {

    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;

    @Override
    public List<PedidoResponse> listar() {

        return pedidoRepository.findAll()
                .stream()
                .map(this::convertir)
                .toList();
    }

    @Override
    public PedidoResponse obtenerPorId(Long id) {

        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado"));

        return convertir(pedido);
    }

    @Override
    public List<PedidoResponse> listarPorUsuario(Long usuarioId) {

        return pedidoRepository.findByUsuarioId(usuarioId)
                .stream()
                .map(this::convertir)
                .toList();
    }

    @Override
    public PedidoResponse guardar(PedidoRequest request) {

        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Pedido pedido = Pedido.builder()
                .usuario(usuario)
                .estado("PENDIENTE")
                .total(BigDecimal.ZERO)
                .build();

        return convertir(pedidoRepository.save(pedido));
    }

    @Override
    public void eliminar(Long id) {

        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado"));

        pedidoRepository.delete(pedido);
    }

    private PedidoResponse convertir(Pedido pedido){

    return PedidoResponse.builder()
            .id(pedido.getId())
            .usuarioId(pedido.getUsuario().getId())
            .usuario(pedido.getUsuario().getNombre())
            .creadoEn(pedido.getCreadoEn())
            .estado(pedido.getEstado())
            .subtotal(pedido.getSubtotal())
            .costoEnvio(pedido.getCostoEnvio())
            .descuento(pedido.getDescuento())
            .total(pedido.getTotal())
            .build();
}

}