package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.event.CheckoutCompletadoEvent;
import com.skd.sublimacion_api.service.EmailService;
import com.skd.sublimacion_api.service.FacturaPdfService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Envío de correos.
 *
 * En producción se usa la API HTTP de Resend (https://api.resend.com/emails),
 * porque Render bloquea la salida SMTP clásica (smtp.gmail.com:465/587 daba
 * timeout). Si no hay RESEND_API_KEY configurada, se usa SMTP (Gmail) como
 * respaldo para el entorno local.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final FacturaPdfService facturaPdfService;
    private final WebClient.Builder webClientBuilder;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String correoDestino;

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${resend.from:SKD Creando Sueños <onboarding@resend.dev>}")
    private String resendFrom;

    // Núcleo: elige Resend HTTP si está configurado; si no, SMTP.
    private void enviarCore(String correo, String subject, String html, String texto,
                            byte[] pdfAdjunto, String nombreAdjunto) {

        if (resendApiKey != null && !resendApiKey.isBlank()) {
            try {
                Map<String, Object> body = new HashMap<>();
                body.put("from", resendFrom);
                body.put("to", List.of(correo));
                body.put("subject", subject);
                if (html != null) {
                    body.put("html", html);
                } else {
                    body.put("text", texto == null ? "" : texto);
                }
                if (pdfAdjunto != null) {
                    body.put("attachments", List.of(Map.of(
                            "filename", nombreAdjunto,
                            "content", Base64.getEncoder().encodeToString(pdfAdjunto))));
                }

                webClientBuilder.build()
                        .post()
                        .uri("https://api.resend.com/emails")
                        .header("Authorization", "Bearer " + resendApiKey)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .bodyValue(body)
                        .retrieve()
                        .toBodilessEntity()
                        .block();
            } catch (RuntimeException e) {
                throw new IllegalStateException("Resend falló: " + e.getMessage(), e);
            }
            return;
        }

        // Respaldo SMTP (local / sin RESEND_API_KEY)
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, pdfAdjunto != null, "UTF-8");
            helper.setTo(correo);
            helper.setSubject(subject);
            if (html != null) {
                helper.setText(html, true);
            } else {
                helper.setText(texto == null ? "" : texto);
            }
            if (pdfAdjunto != null) {
                helper.addAttachment(nombreAdjunto, new ByteArrayResource(pdfAdjunto), "application/pdf");
            }
            mailSender.send(mime);
        } catch (MessagingException e) {
            throw new IllegalStateException("SMTP falló: " + e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarFacturaCompra(CheckoutCompletadoEvent evento) {
        try {
            byte[] pdf = facturaPdfService.generarPdf(evento.getFacturaId());
            String subject = "Tu compra en SKD - Factura " + evento.getNumeroFactura();
            String texto = "Hola " + evento.getNombre() + ",\n\n"
                    + "Gracias por tu compra en SKD. Adjunta encontrarás la factura electrónica "
                    + evento.getNumeroFactura() + ".\n\n¡Que lo disfrutes!";
            enviarCore(evento.getCorreo(), subject, null, texto, pdf, evento.getNumeroFactura() + ".pdf");
            log.info("Correo de confirmación de compra enviado a {}", evento.getCorreo());
        } catch (Exception e) {
            log.error("No se pudo enviar el correo de la factura {}: {}", evento.getNumeroFactura(), e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarBienvenida(String correo, String nombre) {
        try {
            enviarCore(correo, "Bienvenido a SKD", null,
                    "Hola " + nombre + ",\n\nGracias por registrarte en SKD - Sublimación de Sueños.\n"
                            + "Ya puedes explorar nuestro catálogo, crear tus propios diseños y realizar tu primera compra.\n\n"
                            + "¡Nos alegra tenerte con nosotros!",
                    null, null);
            log.info("Correo de bienvenida enviado a {}", correo);
        } catch (Exception e) {
            log.error("No se pudo enviar el correo de bienvenida a {}: {}", correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarRestablecerPassword(String correo, String nombre, String token) {
        try {
            enviarCore(correo, "Restablece tu contraseña - SKD", null,
                    "Hola " + nombre + ",\n\nRecibimos una solicitud para restablecer tu contraseña. "
                            + "Usa el siguiente enlace (válido por 30 minutos):\n\n"
                            + frontendUrl + "/restablecer-password?token=" + token + "\n\n"
                            + "Si no solicitaste este cambio, ignora este correo.",
                    null, null);
            log.info("Correo de restablecimiento de contraseña enviado a {}", correo);
        } catch (Exception e) {
            log.error("No se pudo enviar el correo de restablecimiento a {}: {}", correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarConfirmacionCambioDatos(
            String correo, String nombre, String resumenCambios, String token, String baseUrl) {
        try {
            String urlAprobar = baseUrl + "/api/usuarios/cambios/aprobar?token=" + token;
            String urlRechazar = baseUrl + "/api/usuarios/cambios/rechazar?token=" + token;

            String html = "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;\">"
                    + "<h2 style=\"color:#4f46e5;\">Hola " + nombre + ",</h2>"
                    + "<p>Un administrador de SKD solicitó modificar los siguientes datos de tu cuenta:</p>"
                    + "<div style=\"background:#eef2ff;border-radius:8px;padding:16px;margin:16px 0;\">"
                    + resumenCambios
                    + "</div>"
                    + "<p><strong>Ningún dato se modificará hasta que confirmes.</strong></p>"
                    + "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:24px 0;\"><tr>"
                    + "<td style=\"background:#16a34a;border-radius:8px;\">"
                    + "<a href=\"" + urlAprobar + "\" style=\"display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-weight:bold;\">Aprobar cambio</a>"
                    + "</td><td style=\"width:12px;\"></td>"
                    + "<td style=\"background:#dc2626;border-radius:8px;\">"
                    + "<a href=\"" + urlRechazar + "\" style=\"display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-weight:bold;\">Rechazar cambio</a>"
                    + "</td></tr></table>"
                    + "<p style=\"font-size:12px;color:#6b7280;\">Si no fuiste tú quien solicitó este cambio, puedes ignorar este correo o pulsar \"Rechazar cambio\". "
                    + "Este enlace es válido por 48 horas.</p>"
                    + "</div>";

            enviarCore(correo, "Confirmación de cambio de tus datos - SKD", html, null, null, null);
            log.info("Correo de confirmación de cambio enviado a {}", correo);
        } catch (Exception e) {
            log.error("No se pudo enviar el correo de confirmación de cambio a {}: {}", correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarNotificacion(String correo, String nombre, String titulo, String mensaje) {
        try {
            enviarCore(correo, "SKD - " + titulo, null,
                    "Hola " + nombre + ",\n\n" + mensaje + "\n\nPuedes ver el detalle desde tu bandeja de entrada en SKD.",
                    null, null);
            log.info("Notificación enviada por correo a {}", correo);
        } catch (Exception e) {
            log.error("No se pudo enviar la notificación a {}: {}", correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarContacto(String nombre, String correo, String asunto, String mensaje) {
        try {
            String subj = "[Contacto SKD] " + (asunto == null || asunto.isBlank() ? "Mensaje desde la web" : asunto);
            String texto = "Nuevo mensaje desde la página de contacto:\n\n"
                    + "Nombre: " + nombre + "\n"
                    + "Correo: " + correo + "\n"
                    + "Asunto: " + (asunto == null || asunto.isBlank() ? "—" : asunto) + "\n\n"
                    + mensaje + "\n\nResponder directamente a: " + correo;
            enviarCore(correoDestino, subj, null, texto, null, null);
            log.info("Mensaje de contacto recibido de {}", correo);
        } catch (Exception e) {
            log.error("No se pudo procesar el mensaje de contacto de {}: {}", correo, e.getMessage(), e);
        }
    }

    private static final Map<String, String> ESTADO_PEDIDO_LABEL = Map.ofEntries(
            Map.entry("recibido", "recibido"),
            Map.entry("disenando", "en diseño"),
            Map.entry("imprimiendo", "en impresión"),
            Map.entry("empacando", "en empacado"),
            Map.entry("enviado", "en camino 🚚"),
            Map.entry("entregado", "entregado ✅"),
            Map.entry("cancelado", "cancelado"));

    @Async
    @Override
    public void enviarEstadoPedido(String correo, String nombre, Long pedidoId, String estado) {
        try {
            String label = ESTADO_PEDIDO_LABEL.getOrDefault(
                    estado == null ? "" : estado.toLowerCase(), estado);
            enviarCore(correo, "SKD - Tu pedido #" + pedidoId + " está " + label, null,
                    "Hola " + nombre + ",\n\nTu pedido #" + pedidoId + " ahora está: " + label + ".\n\n"
                            + "Puedes hacer seguimiento en vivo aquí:\n"
                            + frontendUrl + "/pedidos/" + pedidoId + "/seguimiento\n\nGracias por confiar en SKD.",
                    null, null);
            log.info("Correo de estado enviado a {} para pedido #{} (estado {})", correo, pedidoId, estado);
        } catch (Exception e) {
            log.error("No se pudo enviar el correo de estado del pedido #{} a {}: {}", pedidoId, correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarPasswordCambiada(String correo, String nombre) {
        try {
            enviarCore(correo, "SKD - Tu contraseña fue cambiada", null,
                    "Hola " + nombre + ",\n\nTe confirmamos que tu contraseña de SKD fue actualizada correctamente.\n\n"
                            + "Si no fuiste tú, contacta con nosotros lo antes posible desde la página de contacto.",
                    null, null);
            log.info("Correo de cambio de contraseña enviado a {}", correo);
        } catch (Exception e) {
            log.error("No se pudo enviar el correo de cambio de contraseña a {}: {}", correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarCodigoCancelacionCuenta(String correo, String nombre, String codigo) {
        try {
            enviarCore(correo, "SKD - Código para cancelar tu cuenta", null,
                    "Hola " + nombre + ",\n\nRecibimos una solicitud para CANCELAR tu cuenta de SKD.\n\n"
                            + "Tu código de verificación es:\n\nCÓDIGO: " + codigo + "\n\n"
                            + "Ingrésalo en la web para confirmar que deseas continuar (válido por 15 minutos).\n\n"
                            + "Si NO solicitaste cancelar tu cuenta, ignora este correo y tu cuenta permanecerá intacta.\n\n"
                            + "Este código es distinto al de verificación de email o reseteo de contraseña.",
                    null, null);
            log.info("Correo de código de cancelación enviado a {}", correo);
        } catch (Exception e) {
            log.error("No se pudo enviar el correo de cancelación a {}: {}", correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarCuentaEliminada(String correo, String nombre) {
        try {
            enviarCore(correo, "SKD - Tu cuenta ha sido eliminada", null,
                    "Hola " + nombre + ",\n\nTe confirmamos que tu cuenta de SKD ha sido eliminada permanentemente, "
                            + "junto con tus diseños, pedidos, direcciones y todo tu historial.\n\n"
                            + "Lamentamos verte partir. Si fue un error, puedes crear una nueva cuenta en cualquier momento.\n\n"
                            + "Gracias por haber sido parte de SKD.",
                    null, null);
            log.info("Correo de cuenta eliminada enviado a {}", correo);
        } catch (Exception e) {
            log.error("No se pudo enviar el correo de cuenta eliminada a {}: {}", correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarCodigoRegistro(String correo, String codigo) {
        try {
            enviarCore(correo, "SKD - Tu código de verificación", null,
                    "Gracias por registrarte en SKD.\n\nTu código de verificación es:\n\nCÓDIGO: " + codigo + "\n\n"
                            + "Ingrésalo en el formulario de registro para confirmar tu correo (válido por 5 minutos).\n\n"
                            + "Si no solicitaste crear una cuenta en SKD, ignora este correo.",
                    null, null);
            log.info("Código de registro enviado a {}", correo);
        } catch (Exception e) {
            log.error("No se pudo enviar el código de registro a {}: {}", correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarVerificacionEmail(String correo, String nombre, String token) {
        try {
            enviarCore(correo, "SKD - Tu código de verificación", null,
                    "Hola " + nombre + ",\n\nTu código de verificación de SKD es:\n\nCÓDIGO: " + token + "\n\n"
                            + "Ingrésalo en la sección 'Verifica tu correo' de tu panel para confirmar tu cuenta "
                            + "(válido por 24 horas).\n\nTambién puedes confirmar desde este enlace:\n"
                            + frontendUrl + "/verificar-email?token=" + token + "\n\n"
                            + "Si no creaste una cuenta en SKD, ignora este correo.",
                    null, null);
            log.info("Correo de verificación enviado a {}", correo);
        } catch (Exception e) {
            log.error("No se pudo enviar el correo de verificación a {}: {}", correo, e.getMessage(), e);
        }
    }
}
