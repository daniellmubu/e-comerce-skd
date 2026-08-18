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

    @Value("${wompi.redirect-url}")
    private String redirectUrl;

    @Value("${wompi.checkout-url:https://checkout.wompi.co/l}")
    private String checkoutUrl;

    private final WebClient.Builder webClientBuilder;

    private static final Duration TIMEOUT = Duration.ofSeconds(30);

    public record LinkPago(String id, String url, String reference) {}

    /**
     * Crea un link de pago en Wompi para el monto del pedido y devuelve
     * el id, la URL del checkout hospedado y la referencia de la transacción.
     */
    public LinkPago crearLinkPago(BigDecimal monto, Long pedidoId, Long pagoId) {

        long centavos = monto.movePointRight(2).longValueExact();

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

        // La referencia de la transacción no viene en la creación; se obtiene
        // consultando el link recién creado.
        String reference = null;
        Map<String, Object> dataLink = getData("/payment_links/" + id);
        if (dataLink != null) {
            reference = (String) dataLink.get("reference");
        }

        String url = checkoutUrl + "/" + id;

        return new LinkPago(id, url, reference);
    }

    /**
     * Consulta la transacción asociada a una referencia.
     * Devuelve el estado (APPROVED, DECLINED, PENDING, VOIDED, ERROR) o null
     * si aún no existe ninguna transacción para esa referencia.
     */
    public String consultarEstadoTransaccion(String reference) {

        Map<String, Object> respuesta = get("/transactions?reference=" + reference);

        Object data = respuesta.get("data");
        if (data instanceof List<?> transacciones && !transacciones.isEmpty()) {
            Map<String, Object> transaccion = (Map<String, Object>) transacciones.get(0);
            return (String) transaccion.get("status");
        }

        return null;
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
            Map<String, Object> body = ex.getResponseBodyAs(Map.class);
            if (body != null && body.get("error") instanceof Map<?, ?> err) {
                Object reason = ((Map<?, ?>) err).get("reason");
                if (reason != null) {
                    return reason.toString();
                }
            }
        } catch (Exception ignored) {
        }
        return "Wompi rechazó la solicitud (código " + ex.getStatusCode().value() + ").";
    }
}
