package com.skd.sublimacion_api.config;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import com.skd.sublimacion_api.entity.Pago;
import com.skd.sublimacion_api.entity.Pedido;
import com.skd.sublimacion_api.repository.PagoRepository;
import com.skd.sublimacion_api.repository.PedidoRepository;
import com.skd.sublimacion_api.service.InventarioService;
import com.skd.sublimacion_api.service.WebSocketService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Libera la reserva de stock de los pagos online que quedaron "pendiente"
 * más tiempo del permitido (cliente que no completó el pago, push de Nequi
 * sin respuesta, abandono del checkout, etc.).
 *
 * <p>Sin este job, el stock descontado en el checkout quedaría reservado para
 * siempre aunque nunca se cobrara, haciendo bajar el inventario sin venta real.</p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ExpiracionPagoJob {

    private final PagoRepository pagoRepository;
    private final PedidoRepository pedidoRepository;
    private final InventarioService inventarioService;
    private final WebSocketService webSocketService;
    private final PlatformTransactionManager transactionManager;

    /** Minutos que un pago online puede permanecer "pendiente" antes de liberar su reserva. */
    @Value("${app.expiracion-pago.minutos:30}")
    private long minutosExpiracion;

    @Scheduled(fixedDelayString = "${app.expiracion-pago.barrido-ms:60000}")
    public void expirarPagosPendientes() {
        long minutos = Math.max(minutosExpiracion, 1);
        LocalDateTime corte = LocalDateTime.now().minusMinutes(minutos);

        List<Pago> pendientes = pagoRepository.findByEstado("pendiente");
        if (pendientes == null || pendientes.isEmpty()) {
            return;
        }

        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        for (Pago pago : pendientes) {
            try {
                // Se pasa solo el id y dentro de cada transacción se vuelve a cargar
                // el pago: la entidad de la lista viene "detached" (con proxies lazy
                // de la sesión anterior) y no se puede tocar fuera de una sesión activa.
                tx.executeWithoutResult(status -> liberarSiVencido(pago.getId(), corte));
            } catch (Exception e) {
                log.error("[ExpiracionPago] Error liberando pago {}: {}", pago.getId(), e.getMessage(), e);
            }
        }
    }

    private void liberarSiVencido(Long pagoId, LocalDateTime corte) {
        Pago pago = pagoRepository.findById(pagoId).orElse(null);
        if (pago == null) {
            return;
        }

        // Contraentrega no expira automáticamente: su inventario se reserva hasta
        // que el pedido se pague o se cancele de forma manual en el panel.
        if ("efectivo".equalsIgnoreCase(pago.getMetodo())) {
            return;
        }

        // Cargado dentro de la transacción: el pedido (lazy) se puede inicializar.
        Pedido pedido = pago.getPedido();
        if (pedido == null || "cancelado".equalsIgnoreCase(pedido.getEstado())) {
            // Pedido sin referencia o ya liberado/cancelado: no hacer nada.
            return;
        }

        LocalDateTime base = pago.getProcesadoEn() != null
                ? pago.getProcesadoEn()
                : (pedido.getCreadoEn() != null ? pedido.getCreadoEn() : null);
        if (base == null || base.isAfter(corte)) {
            return;
        }

        String estadoPedidoAntes = pedido.getEstado();

        // Devuelve el stock reservado en el checkout (única transacción junto a la
        // marcación del estado para evitar dobles liberaciones).
        //
        // El pago se marca "rechazado" (estado ya permitido por el CHECK de la tabla
        // `pago`) como sinónimo de "expirado/no cobrado": así el job no lo vuelve a
        // procesar y el flujo existente ya sabe que un pago no aprobado liberó stock.
        inventarioService.reponerPedido(pedido.getId());
        pago.setEstado("rechazado");
        pedido.setEstado("cancelado");
        pagoRepository.save(pago);
        pedidoRepository.save(pedido);

        log.info("[ExpiracionPago] Pedido {} / pago {} expirado (pago marcado rechazado); reserva liberada",
                pedido.getId(), pago.getId());

        if (!estadoPedidoAntes.equals(pedido.getEstado())) {
            webSocketService.publicarEstadoPedido(pedido.getId(), pedido.getEstado());
            webSocketService.publicarCambioKanban(pedido.getId(), pedido.getEstado());
        }
    }
}
