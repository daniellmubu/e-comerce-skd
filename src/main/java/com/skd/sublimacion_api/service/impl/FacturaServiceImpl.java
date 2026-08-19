package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.dto.factura.FacturaRequest;
import com.skd.sublimacion_api.dto.factura.FacturaResponse;
import com.skd.sublimacion_api.entity.Factura;
import com.skd.sublimacion_api.entity.Pedido;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.FacturaRepository;
import com.skd.sublimacion_api.repository.PedidoRepository;
import com.skd.sublimacion_api.service.FacturaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class FacturaServiceImpl implements FacturaService {

    private final FacturaRepository facturaRepository;
    private final PedidoRepository pedidoRepository;

    @Override
    public FacturaResponse obtenerPorId(Long id) {

        Factura factura = facturaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada"));

        return convertir(factura);
    }

    @Override
    public FacturaResponse guardar(FacturaRequest request) {

        Pedido pedido = pedidoRepository.findById(request.getPedidoId())
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado"));

        Factura factura = Factura.builder()
                .pedido(pedido)
                .numeroFactura(request.getNumeroFactura())
                .archivoPdfUrl(request.getArchivoPdfUrl())
                .emitidaEn(LocalDateTime.now())
                .build();

        return convertir(facturaRepository.save(factura));
    }

    @Override
    public void eliminar(Long id) {

        Factura factura = facturaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada"));

        facturaRepository.delete(factura);
    }

    private FacturaResponse convertir(Factura factura){

        return FacturaResponse.builder()
                .id(factura.getId())
                .pedidoId(factura.getPedido().getId())
                .numeroFactura(factura.getNumeroFactura())
                .archivoPdfUrl(factura.getArchivoPdfUrl())
                .emitidaEn(factura.getEmitidaEn())
                .build();
    }

}