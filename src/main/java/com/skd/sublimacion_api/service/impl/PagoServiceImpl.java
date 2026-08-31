package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.dto.pago.IniciarPagoWompiResponse;
import com.skd.sublimacion_api.dto.pago.PagoRequest;
import com.skd.sublimacion_api.dto.pago.PagoResponse;
import com.skd.sublimacion_api.dto.pago.SimulacionPagoResponse;
import com.skd.sublimacion_api.dto.pago.SimularTarjetaRequest;
import com.skd.sublimacion_api.entity.Pago;
import com.skd.sublimacion_api.entity.Pedido;
import com.skd.sublimacion_api.exeption.BadRequestException;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.PagoRepository;
import com.skd.sublimacion_api.repository.PedidoRepository;
import com.skd.sublimacion_api.service.PagoService;
import com.skd.sublimacion_api.service.WebSocketService;
import com.skd.sublimacion_api.service.WompiService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PagoServiceImpl implements PagoService {

    private final PagoRepository pagoRepository;
    private final PedidoRepository pedidoRepository;
    private final WompiService wompiService;
    private final WebSocketService webSocketService;

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
    @Transactional
    public SimulacionPagoResponse simularTarjeta(Long pagoId, SimularTarjetaRequest request, Long usuarioId) {

        Pago pago = pagoRepository.findById(pagoId)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado"));

        if (!"tarjeta".equalsIgnoreCase(pago.getMetodo())) {
            throw new BadRequestException("Este pago no se puede simular con tarjeta porque su método es otro.");
        }

        if ("aprobado".equalsIgnoreCase(pago.getEstado())) {
            throw new BadRequestException("Este pago ya fue aprobado.");
        }

        Pedido pedido = pago.getPedido();
        if (!pedido.getUsuario().getId().equals(usuarioId)) {
            throw new BadRequestException("Este pago no te pertenece.");
        }

        boolean aprobado = !"000".equals(request.getCvv());

        String estadoPedidoAntes = pedido.getEstado();
        String mensaje;
        if (aprobado) {
            pago.setEstado("aprobado");
            if ("recibido".equalsIgnoreCase(pedido.getEstado())) {
                pedido.setEstado("disenando");
            }
            mensaje = "Pago aprobado correctamente.";
        } else {
            pago.setEstado("rechazado");
            mensaje = "Pago rechazado. Intenta de nuevo con otro CVV.";
        }

        pago.setProcesadoEn(LocalDateTime.now());
        pagoRepository.save(pago);
        pedidoRepository.save(pedido);

        if (!estadoPedidoAntes.equals(pedido.getEstado())) {
            webSocketService.publicarEstadoPedido(pedido.getId(), pedido.getEstado());
        }

        return SimulacionPagoResponse.builder()
                .pagoId(pago.getId())
                .pedidoId(pedido.getId())
                .estadoPago(pago.getEstado())
                .estadoPedido(pedido.getEstado())
                .aprobado(aprobado)
                .mensaje(mensaje)
                .build();
    }

    @Override
    @Transactional
    public IniciarPagoWompiResponse iniciarPagoWompi(Long pagoId, Long usuarioId) {

        Pago pago = obtenerPagoPropio(pagoId, usuarioId);
        validarPagoParaWompi(pago);

        WompiService.LinkPago link = wompiService.crearLinkPago(
                pago.getMonto(),
                pago.getPedido().getId(),
                pago.getId()
        );

        pago.setReferenciaExterna(link.id());
        pagoRepository.save(pago);

        return IniciarPagoWompiResponse.builder()
                .pagoId(pago.getId())
                .pedidoId(pago.getPedido().getId())
                .url(link.url())
                .referencia(link.reference())
                .build();
    }

    @Override
    @Transactional
    public SimulacionPagoResponse consultarEstadoPago(Long pagoId, Long usuarioId) {

        Pago pago = obtenerPagoPropio(pagoId, usuarioId);

        String estadoWompi = null;
        if (pago.getReferenciaExterna() != null) {
            estadoWompi = wompiService.consultarEstadoTransaccion(pago.getReferenciaExterna());
        }

        boolean aprobado = "APPROVED".equalsIgnoreCase(estadoWompi);
        boolean rechazado = "DECLINED".equalsIgnoreCase(estadoWompi)
                || "VOIDED".equalsIgnoreCase(estadoWompi)
                || "ERROR".equalsIgnoreCase(estadoWompi);

        Pedido pedido = pago.getPedido();
        String estadoPedidoAntes = pedido.getEstado();

        if (aprobado && !"aprobado".equalsIgnoreCase(pago.getEstado())) {
            pago.setEstado("aprobado");
            pago.setProcesadoEn(LocalDateTime.now());
            if ("recibido".equalsIgnoreCase(pedido.getEstado())) {
                pedido.setEstado("disenando");
            }
            pagoRepository.save(pago);
            pedidoRepository.save(pedido);
        } else if (rechazado && !"rechazado".equalsIgnoreCase(pago.getEstado())) {
            pago.setEstado("rechazado");
            pago.setProcesadoEn(LocalDateTime.now());
            pagoRepository.save(pago);
        }

        if (!estadoPedidoAntes.equals(pedido.getEstado())) {
            webSocketService.publicarEstadoPedido(pedido.getId(), pedido.getEstado());
        }

        String mensaje = aprobado
                ? "Pago aprobado correctamente."
                : rechazado
                        ? "El pago fue rechazado."
                        : "El pago aún no se ha completado.";

        return SimulacionPagoResponse.builder()
                .pagoId(pago.getId())
                .pedidoId(pedido.getId())
                .estadoPago(pago.getEstado())
                .estadoPedido(pedido.getEstado())
                .aprobado(aprobado)
                .mensaje(mensaje)
                .build();
    }

    @Override
    public void eliminar(Long id) {

        Pago pago = pagoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado"));

        pagoRepository.delete(pago);
    }

    private Pago obtenerPagoPropio(Long pagoId, Long usuarioId) {

        Pago pago = pagoRepository.findById(pagoId)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado"));

        if (!pago.getPedido().getUsuario().getId().equals(usuarioId)) {
            throw new BadRequestException("Este pago no te pertenece.");
        }

        return pago;
    }

    private void validarPagoParaWompi(Pago pago) {

        boolean esTarjeta = "tarjeta".equalsIgnoreCase(pago.getMetodo());
        boolean esPse = "pse".equalsIgnoreCase(pago.getMetodo());

        if (!esTarjeta && !esPse) {
            throw new BadRequestException("Este método de pago no se procesa en Wompi.");
        }

        if ("aprobado".equalsIgnoreCase(pago.getEstado())) {
            throw new BadRequestException("Este pago ya fue aprobado.");
        }
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