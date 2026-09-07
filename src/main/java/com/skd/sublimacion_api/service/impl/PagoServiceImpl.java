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
import com.skd.sublimacion_api.service.InventarioService;
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
    private final InventarioService inventarioService;
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
        String estadoPagoAntes = pago.getEstado();
        String mensaje;
        if (aprobado) {
            pago.setEstado("aprobado");
            if ("recibido".equalsIgnoreCase(pedido.getEstado())) {
                pedido.setEstado("disenando");
            }
            mensaje = "Pago aprobado correctamente.";
        } else {
            pago.setEstado("rechazado");
            // La reserva de stock hecha en el checkout se libera si el pago no se concreta.
            if ("pendiente".equalsIgnoreCase(estadoPagoAntes)) {
                inventarioService.reponerPedido(pedido.getId());
            }
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
        return iniciarPagoWompi(pagoId, usuarioId, null);
    }

    @Override
    @Transactional
    public IniciarPagoWompiResponse iniciarPagoWompi(Long pagoId, Long usuarioId, String phoneNumber) {

        Pago pago = obtenerPagoPropio(pagoId, usuarioId);

        // Reintento tras un pago rechazado o expirado: su reserva de stock ya fue
        // liberada, así que se vuelve a reservar (si hay inventario) y se reactiva el
        // pedido antes de generar una nueva transacción en Wompi.
        String estadoActual = pago.getEstado() != null ? pago.getEstado().toLowerCase() : "";
        Pedido pedidoPago = pago.getPedido();
        if (("rechazado".equals(estadoActual) || "expirado".equals(estadoActual))
                && pedidoPago != null
                && ("recibido".equalsIgnoreCase(pedidoPago.getEstado())
                        || "cancelado".equalsIgnoreCase(pedidoPago.getEstado()))) {
            inventarioService.reservarPedido(pedidoPago.getId());
            if ("cancelado".equalsIgnoreCase(pedidoPago.getEstado())) {
                pedidoPago.setEstado("recibido");
                pedidoRepository.save(pedidoPago);
            }
            pago.setEstado("pendiente");
            pagoRepository.save(pago);
        }

        validarPagoParaWompi(pago);

        String metodo = pago.getMetodo() != null ? pago.getMetodo().toLowerCase() : "";

        // Idempotencia para PSE/Tarjeta: reutilizar link existente
        // Para Nequi: solo reutiliza si NO se está cambiando de número (phoneNumber == null)
        // y el pago sigue pendiente. Si el usuario da "Cambiar número" y reenvía push con nuevo teléfono,
        // se crea una nueva transacción y se sobrescribe la anterior (la anterior queda huérfana y expira en Wompi).
        boolean tieneTransaccion = (pago.getWompiTransactionId() != null && !pago.getWompiTransactionId().isBlank())
                || (pago.getReferenciaExterna() != null && !pago.getReferenciaExterna().isBlank());
        if (tieneTransaccion) {
            if ("nequi".equals(metodo)) {
                if (phoneNumber == null || phoneNumber.isBlank()) {
                    // Polling/consulta sin nuevo teléfono -> reutilizar transacción pendiente
                    return IniciarPagoWompiResponse.builder()
                            .pagoId(pago.getId())
                            .pedidoId(pago.getPedido().getId())
                            .url(null)
                            .referencia(pago.getReferenciaExterna())
                            .build();
                }
                // Si viene phoneNumber nuevo, no retornamos: se creará nueva transacción abajo
                // (para "Cambiar número" o reintento tras expiración)
                if ("aprobado".equalsIgnoreCase(pago.getEstado())) {
                    // Ya aprobado, no crear otra
                    return IniciarPagoWompiResponse.builder()
                            .pagoId(pago.getId())
                            .pedidoId(pago.getPedido().getId())
                            .url(null)
                            .referencia(pago.getReferenciaExterna())
                            .build();
                }
            } else {
                String referenciaGuardada = pago.getReferenciaExterna();
                String urlExistente = "https://checkout.wompi.co/l/" + (referenciaGuardada != null ? referenciaGuardada : pago.getWompiTransactionId());
                return IniciarPagoWompiResponse.builder()
                        .pagoId(pago.getId())
                        .pedidoId(pago.getPedido().getId())
                        .url(urlExistente)
                        .referencia(referenciaGuardada)
                        .build();
            }
        }

        // Flujo directo Nequi: transacción push sin checkout hospedado
        if ("nequi".equals(metodo)) {
            if (phoneNumber == null || phoneNumber.isBlank()) {
                throw new BadRequestException("Debes proporcionar tu número Nequi (10 dígitos, empieza por 3).");
            }
            String phone = phoneNumber.replaceAll("\\D", "");
            if (!phone.matches("3\\d{9}")) {
                throw new BadRequestException("Número Nequi inválido. Ej: 3001234567");
            }
            String email = pago.getPedido().getUsuario().getCorreo();
            try {
                WompiService.TransaccionNequi tx = wompiService.crearTransaccionNequi(
                        pago.getMonto(),
                        pago.getPedido().getId(),
                        pago.getId(),
                        phone,
                        email
                );
                pago.setReferenciaExterna(tx.reference());
                pago.setWompiTransactionId(tx.id());
                pagoRepository.save(pago);
                // No hay URL: el push ya fue enviado al celular
                return IniciarPagoWompiResponse.builder()
                        .pagoId(pago.getId())
                        .pedidoId(pago.getPedido().getId())
                        .url(null)
                        .referencia(tx.reference())
                        .build();
            } catch (BadRequestException ex) {
                String msgLower = ex.getMessage() != null ? ex.getMessage().toLowerCase() : "";
                // Si es error de validación de teléfono/monto, propagar para que el usuario corrija
                if (msgLower.contains("nequi") || msgLower.contains("phone") || msgLower.contains("celular") || msgLower.contains("monto")) {
                    throw ex;
                }
                // Fallback: si Wompi no tiene Nequi habilitado o 422 por acceptance, usa checkout hospedado
                System.err.println("[PagoService] Nequi directo falló, fallback a payment_link: " + ex.getMessage());
                WompiService.LinkPago link = wompiService.crearLinkPago(
                        pago.getMonto(),
                        pago.getPedido().getId(),
                        pago.getId()
                );
                String referenciaAGuardar = link.reference() != null ? link.reference() : link.id();
                pago.setReferenciaExterna(referenciaAGuardar);
                pago.setWompiTransactionId(link.id());
                pagoRepository.save(pago);
                return IniciarPagoWompiResponse.builder()
                        .pagoId(pago.getId())
                        .pedidoId(pago.getPedido().getId())
                        .url(link.url())
                        .referencia(referenciaAGuardar)
                        .build();
            }
        }

        // Flujo PSE/Tarjeta: link hospedado
        WompiService.LinkPago link = wompiService.crearLinkPago(
                pago.getMonto(),
                pago.getPedido().getId(),
                pago.getId()
        );

        String referenciaAGuardar = link.reference() != null ? link.reference() : link.id();
        pago.setReferenciaExterna(referenciaAGuardar);
        pago.setWompiTransactionId(link.id());
        pagoRepository.save(pago);

        return IniciarPagoWompiResponse.builder()
                .pagoId(pago.getId())
                .pedidoId(pago.getPedido().getId())
                .url(link.url())
                .referencia(referenciaAGuardar)
                .build();
    }

    @Override
    @Transactional
    public SimulacionPagoResponse consultarEstadoPago(Long pagoId, Long usuarioId) {

        Pago pago = obtenerPagoPropio(pagoId, usuarioId);

        String estadoWompi = null;
        // Consulta unificada por id real (flujo Nequi) o por referencia (fallback/payment_link)
        // Ambos, polling automático cada 4s y botón manual, usan este mismo endpoint.
        if (pago.getWompiTransactionId() != null || pago.getReferenciaExterna() != null) {
            estadoWompi = wompiService.consultarEstadoTransaccionUnificado(
                    pago.getWompiTransactionId(), pago.getReferenciaExterna());
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
            String estadoPagoAntes = pago.getEstado();
            pago.setEstado("rechazado");
            pago.setProcesadoEn(LocalDateTime.now());
            // Libera la reserva de stock si el pago aún estaba pendiente (nunca cobrado).
            if ("pendiente".equalsIgnoreCase(estadoPagoAntes)) {
                inventarioService.reponerPedido(pedido.getId());
            }
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
        boolean esNequi = "nequi".equalsIgnoreCase(pago.getMetodo());

        if (!esTarjeta && !esPse && !esNequi) {
            throw new BadRequestException("Este método de pago no se procesa en Wompi. Usa tarjeta, PSE o Nequi.");
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