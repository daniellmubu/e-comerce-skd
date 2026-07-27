package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.dto.pago.PagoRequest;
import com.skd.sublimacion_api.dto.pago.PagoResponse;
import com.skd.sublimacion_api.entity.Pago;
import com.skd.sublimacion_api.entity.Pedido;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.PagoRepository;
import com.skd.sublimacion_api.repository.PedidoRepository;
import com.skd.sublimacion_api.service.PagoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PagoServiceImpl implements PagoService {

    private final PagoRepository pagoRepository;
    private final PedidoRepository pedidoRepository;

    @Override
    public List<PagoResponse> listar() {
        return pagoRepository.findAll()
                .stream()
                .map(this::convertir)
                .toList();
    }

    @Override
    public PagoResponse obtenerPorId(Long id) {

        Pago pago = pagoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado"));

        return convertir(pago);
    }

    @Override
    public PagoResponse guardar(PagoRequest request) {

        Pedido pedido = pedidoRepository.findById(request.getPedidoId())
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado"));

        Pago pago = Pago.builder()
                .pedido(pedido)
                .metodo(request.getMetodo())
                .estado("pendiente")
                .monto(request.getMonto())
                .procesadoEn(LocalDateTime.now())
                .build();

        return convertir(pagoRepository.save(pago));
    }

    @Override
    public void eliminar(Long id) {

        Pago pago = pagoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado"));

        pagoRepository.delete(pago);
    }

    private PagoResponse convertir(Pago pago){

        return PagoResponse.builder()
                .id(pago.getId())
                .pedidoId(pago.getPedido().getId())
                .metodo(pago.getMetodo())
                .estado(pago.getEstado())
                .referenciaExterna(pago.getReferenciaExterna())
                .monto(pago.getMonto())
                .procesadoEn(pago.getProcesadoEn())
                .build();
    }

}