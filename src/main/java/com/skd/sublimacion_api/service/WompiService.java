package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.exeption.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Cliente de la pasarela de pagos Wompi (modo sandbox).
 *
 * Flujo usado: "link de pago" (checkout hospedado). El backend crea un
 * payment link, el usuario paga en la página de Wompi y después se consulta
 * la transacción por referencia para confirmar o rechazar el pago.
 */
@Service
@RequiredArgsConstructor
public class WompiService {

    @Value("${wompi.base-url}")
    private String baseUrl;

    @Value("${wompi.private-key}")
    private String privateKey;

    @Value("${wompi.public-key:}")
    private String publicKey;

    @Value("${wompi.integrity-secret:}")
    private String integritySecret;

    @Value("${wompi.redirect-url}")
    private String redirectUrl;

    @Value("${wompi.checkout-url:https://checkout.wompi.co/l}")
    private String checkoutUrl;

    private final WebClient.Builder webClientBuilder;

    private static final Duration TIMEOUT = Duration.ofSeconds(30);

    public record LinkPago(String id, String url, String reference) {}
    public record TransaccionNequi(String id, String reference, String status) {}

    /**
     * Crea un link de pago en Wompi para el monto del pedido y devuelve
     * el id, la URL del checkout hospedado y la referencia de la transacción.
     */
    public LinkPago crearLinkPago(BigDecimal monto, Long pedidoId, Long pagoId) {
        if (monto == null || monto.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("El monto del pago no es válido.");
        }
        BigDecimal montoEscalado = monto.setScale(2, java.math.RoundingMode.HALF_UP);
        long centavos;
        try {
            centavos = montoEscalado.movePointRight(2).longValueExact();
        } catch (ArithmeticException ex) {
            throw new BadRequestException("El monto del pago tiene formato inválido.");
        }
        if (centavos <= 0) {
            throw new BadRequestException("El monto debe ser mayor a cero.");
        }

        String redirect = redirectUrl
                + (redirectUrl.contains("?") ? "&" : "?")
                + "pagoId=" + pagoId;

        Map<String, Object> body = Map.of(
                "name", "SKD - Pedido #" + pedidoId,
                "description", "Pago del pedido " + pedidoId,
                "single_use", true,
                "collect_shipping", false,
                "currency", "COP",
                "amount_in_cents", centavos,
                "redirect_url", redirect,
                "sku", "pedido-" + pedidoId
        );

        Map<String, Object> data = post("/payment_links", body);

        String id = (String) data.get("id");
        if (id == null) {
            throw new BadRequestException("Wompi no devolvió un link de pago válido.");
        }

        // La referencia se obtiene consultando el link; si no está disponible
        // se usa el propio id como referencia fallback para permitir la
        // verificación posterior sin romper el flujo.
        String reference = null;
        try {
            Map<String, Object> dataLink = getData("/payment_links/" + id);
            if (dataLink != null) {
                reference = (String) dataLink.get("reference");
            }
        } catch (Exception ignored) {
            // Si falla la consulta, continuamos con id como referencia
        }
        if (reference == null || reference.isBlank()) {
            reference = id;
        }

        String url = checkoutUrl + "/" + id;

        return new LinkPago(id, url, reference);
    }

    /**
     * Crea una transacción directa de Nequi (push al celular).
     * No usa checkout hospedado: Wompi envía notificación push a la app Nequi.
     * El usuario debe confirmar el pago en su celular. El estado inicial es PENDING.
     */
    public TransaccionNequi crearTransaccionNequi(BigDecimal monto, Long pedidoId, Long pagoId, String phoneNumber, String customerEmail) {
        if (monto == null || monto.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("El monto del pago no es válido.");
        }
        if (phoneNumber == null || !phoneNumber.matches("3\\d{9}")) {
            throw new BadRequestException("Número Nequi inválido. Debe ser 10 dígitos empezando por 3.");
        }
        BigDecimal montoEscalado = monto.setScale(2, java.math.RoundingMode.HALF_UP);
        long centavos;
        try {
            centavos = montoEscalado.movePointRight(2).longValueExact();
        } catch (ArithmeticException ex) {
            throw new BadRequestException("El monto del pago tiene formato inválido.");
        }

        String acceptanceToken = obtenerAcceptanceToken();
        String reference = "SKD-" + pedidoId + "-" + pagoId + "-" + System.currentTimeMillis();

        Map<String, Object> paymentMethod = Map.of(
                "type", "NEQUI",
                "phone_number", phoneNumber
        );

        Map<String, Object> body = new java.util.HashMap<>();
        body.put("amount_in_cents", centavos);
        body.put("currency", "COP");
        body.put("reference", reference);
        body.put("customer_email", customerEmail != null && !customerEmail.isBlank() ? customerEmail : "cliente@skd.com");
        body.put("payment_method", paymentMethod);
        body.put("acceptance_token", acceptanceToken);
        // Firma de integridad: SHA256(referencia + monto_en_centavos + moneda + secreto)
        // Requerida si el comercio tiene integrity check activado en Wompi dashboard.
        // Se genera justo antes de crear la transacción (no se cachea).
        String signature = generarFirmaIntegridad(reference, String.valueOf(centavos), "COP");
        if (signature != null) {
            body.put("signature", signature);
        }
        // Para Nequi no se envía redirect_url (solo para checkout hospedado)
        // para evitar 422 por URL localhost no https en validación de Wompi

        Map<String, Object> data = post("/transactions", body);
        if (data == null || data.get("id") == null) {
            throw new BadRequestException("Wompi no devolvió una transacción Nequi válida.");
        }
        String id = (String) data.get("id");
        String status = (String) data.get("status");
        String ref = (String) data.get("reference");
        if (ref == null) ref = reference;
        return new TransaccionNequi(id, ref, status);
    }

    /**
     * Obtiene el acceptance_token del comercio desde Wompi.
     */
    public String obtenerAcceptanceToken() {
        if (publicKey == null || publicKey.isBlank()) {
            throw new BadRequestException("Wompi public key no configurada.");
        }
        try {
            Map<String, Object> resp = webClientBuilder.build()
                    .get()
                    .uri(baseUrl + "/merchants/" + publicKey)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(TIMEOUT)
                    .block();
            if (resp == null || resp.get("data") == null) {
                throw new BadRequestException("No se pudo obtener el acceptance token de Wompi.");
            }
            Map<String, Object> data = (Map<String, Object>) resp.get("data");
            Map<String, Object> presigned = (Map<String, Object>) data.get("presigned_acceptance");
            if (presigned == null || presigned.get("acceptance_token") == null) {
                throw new BadRequestException("Wompi no devolvió acceptance_token.");
            }
            return (String) presigned.get("acceptance_token");
        } catch (WebClientResponseException ex) {
            throw new BadRequestException(extraerMensajeError(ex));
        } catch (RuntimeException ex) {
            throw new BadRequestException("No se pudo conectar con Wompi para el acceptance token.");
        }
    }

    /**
     * Genera la firma de integridad SHA256(referencia + monto_en_centavos + moneda + secreto).
     * Retorna null si no hay secreto configurado (modo sin integrity check).
     */
    public String generarFirmaIntegridad(String reference, String amountInCents, String currency) {
        if (integritySecret == null || integritySecret.isBlank()) {
            return null;
        }
        try {
            String cadena = reference + amountInCents + currency + integritySecret;
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(cadena.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception ex) {
            throw new BadRequestException("No se pudo generar la firma de integridad.");
        }
    }

    /**
     * Consulta el estado por id real de transacción Wompi (GET /transactions/{id}).
     * Es el método preferido para Nequi directo (flujo real).
     */
    public String consultarEstadoPorId(String transactionId) {
        if (transactionId == null || transactionId.isBlank()) {
            return null;
        }
        try {
            Map<String, Object> data = getData("/transactions/" + transactionId);
            if (data != null) {
                return (String) data.get("status");
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    /**
     * Consulta la transacción asociada a una referencia.
     * Devuelve el estado (APPROVED, DECLINED, PENDING, VOIDED, ERROR) o null
     * si aún no existe ninguna transacción para esa referencia.
     * Fallback para flujos legacy (payment_link).
     */
    public String consultarEstadoTransaccion(String reference) {
        if (reference == null || reference.isBlank()) {
            return null;
        }

        Map<String, Object> respuesta = get("/transactions?reference=" + reference);

        Object data = respuesta.get("data");
        if (data instanceof List<?> transacciones && !transacciones.isEmpty()) {
            Map<String, Object> transaccion = (Map<String, Object>) transacciones.get(0);
            return (String) transaccion.get("status");
        }

        return null;
    }

    /**
     * Consulta unificada: primero intenta por id (flujo Nequi real), luego por referencia (fallback).
     */
    public String consultarEstadoTransaccionUnificado(String transactionId, String reference) {
        if (transactionId != null && !transactionId.isBlank()) {
            String porId = consultarEstadoPorId(transactionId);
            if (porId != null) return porId;
        }
        return consultarEstadoTransaccion(reference);
    }

    private Map<String, Object> post(String path, Map<String, Object> body) {
        try {
            Map<String, Object> respuesta = webClientBuilder.build()
                    .post()
                    .uri(baseUrl + path)
                    .header("Authorization", "Bearer " + privateKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(TIMEOUT)
                    .block();

            return (Map<String, Object>) respuesta.get("data");
        } catch (WebClientResponseException ex) {
            throw new BadRequestException(extraerMensajeError(ex));
        } catch (RuntimeException ex) {
            throw new BadRequestException("No se pudo conectar con Wompi. Intenta de nuevo.");
        }
    }

    private Map<String, Object> get(String path) {
        try {
            return webClientBuilder.build()
                    .get()
                    .uri(baseUrl + path)
                    .header("Authorization", "Bearer " + privateKey)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(TIMEOUT)
                    .block();
        } catch (WebClientResponseException ex) {
            throw new BadRequestException(extraerMensajeError(ex));
        } catch (RuntimeException ex) {
            throw new BadRequestException("No se pudo conectar con Wompi. Intenta de nuevo.");
        }
    }

    private Map<String, Object> getData(String path) {
        Map<String, Object> respuesta = get(path);
        return respuesta != null ? (Map<String, Object>) respuesta.get("data") : null;
    }

    private String extraerMensajeError(WebClientResponseException ex) {
        try {
            String raw = ex.getResponseBodyAsString();
            // Log detallado para diagnóstico en backend
            System.err.println("[Wompi] Error " + ex.getStatusCode().value() + " body: " + raw);
            Map<String, Object> body = ex.getResponseBodyAs(Map.class);
            if (body != null && body.get("error") instanceof Map<?, ?> err) {
                Object reason = err.get("reason");
                Object messages = err.get("messages");
                StringBuilder sb = new StringBuilder();
                if (reason != null) sb.append(reason.toString());
                if (messages instanceof Map<?, ?> msgMap && !msgMap.isEmpty()) {
                    if (sb.length() > 0) sb.append(" - ");
                    sb.append(msgMap.toString());
                } else if (messages instanceof List<?> msgList && !msgList.isEmpty()) {
                    if (sb.length() > 0) sb.append(" - ");
                    sb.append(msgList.toString());
                } else if (err.get("message") != null) {
                    if (sb.length() > 0) sb.append(" - ");
                    sb.append(err.get("message").toString());
                }
                if (sb.length() > 0) {
                    // Mensaje más amigable para 422 de Nequi
                    String msg = sb.toString();
                    if (msg.toLowerCase().contains("phone")) {
                        return "Número Nequi inválido. Usa un celular de 10 dígitos que empiece por 3 (ej: 3001234567). En sandbox usa 3991111111 para prueba aprobada.";
                    }
                    if (msg.toLowerCase().contains("acceptance")) {
                        return "No se pudo validar la aceptación de términos de Wompi. Intenta de nuevo.";
                    }
                    if (msg.toLowerCase().contains("amount")) {
                        return "Monto inválido para Nequi.";
                    }
                    return msg;
                }
            }
            if (raw != null && !raw.isBlank() && raw.length() < 500) {
                return raw;
            }
        } catch (Exception ignored) {
        }
        return "Wompi rechazó la solicitud (código " + ex.getStatusCode().value() + "). Revisa el número Nequi e intenta con 3991111111 (sandbox).";
    }
}
