package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.entity.Pago;
import com.skd.sublimacion_api.entity.Pedido;
import com.skd.sublimacion_api.repository.PagoRepository;
import com.skd.sublimacion_api.repository.PedidoRepository;
import com.skd.sublimacion_api.service.WebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/wompi")
@RequiredArgsConstructor
@Slf4j
public class WompiWebhookController {

    private final PagoRepository pagoRepository;
    private final PedidoRepository pedidoRepository;
    private final WebSocketService webSocketService;

    @Value("${wompi.events-key:}")
    private String eventsKey;

    @PostMapping
    public ResponseEntity<Map<String, String>> recibirEvento(
            @RequestHeader(value = "X-Wompi-Signature", required = false) String signature,
            @RequestBody Map<String, Object> payload) {

        log.info("Webhook Wompi recibido: {}", payload);

        // Validar firma si hay eventsKey configurada
        if (eventsKey != null && !eventsKey.isBlank() && signature != null) {
            if (!validarFirma(payload, signature)) {
                log.warn("Firma Wompi inválida");
                return ResponseEntity.status(401).body(Map.of("error", "Firma inválida"));
            }
        }

        try {
            Map<String, Object> data = (Map<String, Object>) payload.get("data");
            if (data == null) data = payload;
            Map<String, Object> transaction = (Map<String, Object>) data.get("transaction");
            if (transaction == null) transaction = data;

            String reference = (String) transaction.get("reference");
            String status = (String) transaction.get("status");

            if (reference == null || status == null) {
                return ResponseEntity.ok(Map.of("status", "ignorado"));
            }

            Pago pago = pagoRepository.findByReferenciaExterna(reference).orElse(null);
            if (pago == null) {
                // Buscar por id en reference si contiene pagoId
                log.warn("Pago no encontrado para reference {}", reference);
                return ResponseEntity.ok(Map.of("status", "pago no encontrado"));
            }

            Pedido pedido = pago.getPedido();
            String estadoAntes = pedido.getEstado();
            boolean aprobado = "APPROVED".equalsIgnoreCase(status);
            boolean rechazado = "DECLINED".equalsIgnoreCase(status) || "VOIDED".equalsIgnoreCase(status) || "ERROR".equalsIgnoreCase(status);

            if (aprobado) {
                pago.setEstado("aprobado");
                if ("recibido".equalsIgnoreCase(pedido.getEstado())) pedido.setEstado("disenando");
            } else if (rechazado) {
                pago.setEstado("rechazado");
            } else {
                pago.setEstado("pendiente");
            }
            pagoRepository.save(pago);
            pedidoRepository.save(pedido);

            if (!estadoAntes.equals(pedido.getEstado())) {
                webSocketService.publicarEstadoPedido(pedido.getId(), pedido.getEstado());
            }

            return ResponseEntity.ok(Map.of("status", "ok", "pedido", String.valueOf(pedido.getId())));
        } catch (Exception e) {
            log.error("Error procesando webhook Wompi", e);
            return ResponseEntity.ok(Map.of("status", "error procesado"));
        }
    }

    private boolean validarFirma(Map<String, Object> payload, String signature) {
        try {
            String concat = payload.toString();
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(eventsKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(concat.getBytes(StandardCharsets.UTF_8));
            String computed = HexFormat.of().formatHex(hash);
            return computed.equalsIgnoreCase(signature);
        } catch (Exception e) {
            return false;
        }
    }
}
