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
import org.springframework.http.MediaType;
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
 * Envío de correos con imagen de marca (logo, colores y códigos resaltados).
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

    /** Color de marca principal (indigo). */
    private static final String MARCA_PRIMARIO = "#4f46e5";
    private static final String MARCA_SECUNDARIO = "#7c3aed";

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

    // ------------------------------------------------------------------
    // Núcleo de envío
    // ------------------------------------------------------------------

    /** Elige Resend HTTP si está configurado; si no, SMTP. */
    private void enviarCore(String correo, String subject, String html, String texto,
                            byte[] pdfAdjunto, String nombreAdjunto) {

        String htmlCompleto = html != null ? html : textoAHtml(texto);

        if (resendApiKey != null && !resendApiKey.isBlank()) {
            try {
                Map<String, Object> body = new HashMap<>();
                body.put("from", resendFrom);
                body.put("to", List.of(correo));
                body.put("subject", subject);
                body.put("html", htmlCompleto);
                if (texto != null) {
                    body.put("text", texto);
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
                        .contentType(MediaType.APPLICATION_JSON)
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
            helper.setText(htmlCompleto, true);
            if (pdfAdjunto != null) {
                helper.addAttachment(nombreAdjunto, new ByteArrayResource(pdfAdjunto), "application/pdf");
            }
            mailSender.send(mime);
        } catch (MessagingException e) {
            throw new IllegalStateException("SMTP falló: " + e.getMessage(), e);
        }
    }

    // ------------------------------------------------------------------
    // Plantilla de marca
    // ------------------------------------------------------------------

    /**
     * Envuelve el cuerpo (HTML) dentro del layout de SKD: header con logo,
     * bloque de contenido y footer. Uso exclusivo de tablas + estilos en
     * línea para máxima compatibilidad con clientes de correo.
     */
    private String plantillaHtml(String cuerpoHtml) {
        String logoUrl = frontendUrl + "/pwa-192x192.png";
        String dominio = frontendUrl.replaceFirst("^https?://", "");

        return "<!DOCTYPE html>"
                + "<html lang=\"es\"><head><meta charset=\"UTF-8\"/>"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>"
                + "<title>SKD Creando Sueños</title></head>"
                + "<body style=\"margin:0;padding:0;background-color:#eef2ff;"
                + "font-family:Inter,Arial,Helvetica,sans-serif;\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"background-color:#eef2ff;padding:24px 12px;\">"
                + "<tr><td align=\"center\">"
                + "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"max-width:600px;width:100%;background:#ffffff;border-radius:18px;"
                + "overflow:hidden;border:1px solid #e0e7ff;\">"

                // Header
                + "<tr><td style=\"background:linear-gradient(135deg," + MARCA_PRIMARIO + ","
                + MARCA_SECUNDARIO + ");padding:22px 32px;\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr>"
                + "<td style=\"vertical-align:middle;\">"
                + "<img src=\"" + logoUrl + "\" width=\"52\" height=\"52\" alt=\"SKD\" "
                + "style=\"display:block;border-radius:12px;\" />"
                + "</td>"
                + "<td style=\"padding-left:16px;vertical-align:middle;\">"
                + "<div style=\"color:#ffffff;font-size:20px;font-weight:800;letter-spacing:.5px;\">"
                + "SKD <span style=\"color:#a5b4fc;\">Creando Sueños</span></div>"
                + "<div style=\"color:#c7d2fe;font-size:12px;margin-top:2px;\">"
                + "Sublimación personalizada &middot; productos únicos</div>"
                + "</td></tr></table></td></tr>"

                // Cuerpo
                + "<tr><td style=\"padding:32px;\">" + cuerpoHtml + "</td></tr>"

                // Footer
                + "<tr><td style=\"background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">"
                + "<tr><td style=\"color:#64748b;font-size:12px;line-height:1.7;\">"
                + "¿Necesitas ayuda? Escríbenos desde "
                + "<a href=\"" + frontendUrl + "/contacto\" style=\"color:" + MARCA_PRIMARIO
                + ";text-decoration:none;font-weight:600;\">nuestra página de contacto</a>.<br/>"
                + "SKD &mdash; Creando Sueños &middot; " + dominio + "</td></tr></table></td></tr>"
                + "</table>"
                + "<div style=\"color:#94a3b8;font-size:11px;padding:14px 0 0;text-align:center;\">"
                + "Este es un correo automático de SKD. Si no esperabas este mensaje, ignóralo.</div>"
                + "</td></tr></table></body></html>";
    }

    /**
     * Convierte un mensaje en texto plano a HTML con la imagen de marca:
     * escapa caracteres, convierte URLs en enlaces y resalta los códigos
     * de verificación (CÓDIGO: xxxxx) que llegan en el texto.
     */
    private String textoAHtml(String texto) {
        if (texto == null || texto.isBlank()) {
            return "<p style=\"margin:0;color:#334155;\">&nbsp;</p>";
        }
        String esc = texto
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");

        StringBuilder html = new StringBuilder();
        String[] parrafos = esc.split("\\n\\s*\\n");
        for (String parrafo : parrafos) {
            String p = parrafo.trim().replace("\n", "<br/>");
            // Convierte URLs en enlaces clicables.
            p = p.replaceAll("(https?://\\S+)",
                    "<a href=\"$1\" style=\"color:" + MARCA_PRIMARIO + ";text-decoration:none;\">$1</a>");
            // Resalta los códigos de verificación / cancelación.
            p = p.replaceAll("(C[ÓO]DIGO:\\s*)([\\w\\-]+)",
                    "$1<strong style=\"font-family:Consolas,Menlo,monospace;font-size:18px;"
                            + "letter-spacing:2px;color:" + MARCA_PRIMARIO + ";\">$2</strong>");
            if (p.isEmpty()) {
                continue;
            }
            html.append("<p style=\"margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;\">")
                    .append(p).append("</p>");
        }
        return html.toString();
    }

    /** Construye un botón de acción clicable (enlaces de confirmación). */
    private static String botonHtml(String url, String etiqueta, String colorFondo) {
        return "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:4px 0 20px;\">"
                + "<tr><td style=\"border-radius:12px;background:" + colorFondo + ";\">"
                + "<a href=\"" + url + "\" style=\"display:inline-block;padding:13px 26px;color:#ffffff;"
                + "text-decoration:none;font-size:15px;font-weight:700;border-radius:12px;\">"
                + etiqueta + "</a></td></tr></table>";
    }

    // ------------------------------------------------------------------
    // Métodos de envío
    // ------------------------------------------------------------------

    @Async
    @Override
    public void enviarFacturaCompra(CheckoutCompletadoEvent evento) {
        try {
            byte[] pdf = facturaPdfService.generarPdf(evento.getFacturaId());
            String subject = "Tu compra en SKD - Factura " + evento.getNumeroFactura();
            String texto = "Hola " + evento.getNombre() + ",\n\n"
                    + "Gracias por tu compra en SKD. Adjunta encontrarás la factura electrónica "
                    + evento.getNumeroFactura() + ".\n\n¡Que lo disfrutes!";
            String cuerpo = "<h2 style=\"margin:0 0 8px;color:#0f172a;font-size:20px;\">¡Gracias por tu compra, " + esc(evento.getNombre()) + "! 🎉</h2>"
                    + "<p style=\"margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;\">Tu pedido ya está en producción. Adjuntamos tu <strong>factura electrónica " + esc(evento.getNumeroFactura()) + "</strong> en PDF con los colores de SKD (indigo/violet) y tus datos de compra.</p>"
                    + "<div style=\"background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px;padding:16px;margin:0 0 16px;\">"
                    + "<p style=\"margin:0;color:#4338ca;font-size:12px;font-weight:bold;letter-spacing:0.5px;\">FACTURA</p>"
                    + "<p style=\"margin:4px 0 0;color:#0f172a;font-size:16px;font-weight:bold;\">" + esc(evento.getNumeroFactura()) + "</p>"
                    + "<p style=\"margin:4px 0 0;color:#64748b;font-size:12px;\">Pedido asociado al correo " + esc(evento.getCorreo()) + "</p>"
                    + "</div>"
                    + botonHtml(frontendUrl + "/mis-pedidos", "Ver mis pedidos", MARCA_PRIMARIO)
                    + "<p style=\"margin:0;color:#64748b;font-size:13px;\">Este correo incluye el PDF adjunto con el nuevo diseño. Si no ves el adjunto, responde a este correo y te lo reenviamos.</p>";
            enviarCore(evento.getCorreo(), subject, plantillaHtml(cuerpo), texto, pdf, evento.getNumeroFactura() + ".pdf");
            log.info("Correo de confirmación de compra enviado a {}", evento.getCorreo());
        } catch (Exception e) {
            log.error("No se pudo enviar el correo de la factura {}: {}", evento.getNumeroFactura(), e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarBienvenida(String correo, String nombre) {
        try {
            String texto = "Hola " + nombre + ",\n\n"
                    + "¡Bienvenido a SKD! Ya puedes explorar nuestro catálogo, crear tus propios "
                    + "diseños personalizados y hacer tu primera compra.\n\n"
                    + "Si necesitas ideas, visita " + frontendUrl + "\n\n"
                    + "¡Nos alegra tenerte con nosotros!";
            enviarCore(correo, "¡Bienvenido a SKD!", null, texto, null, null);
            log.info("Correo de bienvenida enviado a {}", correo);
        } catch (Exception e) {
            log.error("No se pudo enviar el correo de bienvenida a {}: {}", correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarRestablecerPassword(String correo, String nombre, String token) {
        try {
            String url = frontendUrl + "/restablecer-password?token=" + token;
            String texto = "Hola " + nombre + ",\n\n"
                    + "Recibimos una solicitud para restablecer tu contraseña. "
                    + "El enlace es válido por 30 minutos:\n\n"
                    + url + "\n\n"
                    + "Si no solicitaste este cambio, ignora este correo.";
            String cuerpo = "<h2 style=\"margin:0 0 8px;color:#0f172a;font-size:20px;\">Hola "
                    + esc(nombre) + ",</h2>"
                    + "<p style=\"margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;\">"
                    + "Recibimos una solicitud para <strong>restablecer tu contraseña</strong>. "
                    + "El enlace es válido por <strong>30 minutos</strong>.</p>"
                    + botonHtml(url, "Restablecer contraseña", MARCA_PRIMARIO)
                    + "<p style=\"margin:0;color:#64748b;font-size:13px;line-height:1.6;\">"
                    + "Si no solicitaste este cambio, ignora este correo y tu contraseña seguirá igual.</p>";
            enviarCore(correo, "Restablece tu contraseña - SKD", plantillaHtml(cuerpo), texto, null, null);
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

            String cuerpo = "<h2 style=\"margin:0 0 8px;color:#0f172a;font-size:20px;\">Hola "
                    + esc(nombre) + ",</h2>"
                    + "<p style=\"margin:0 0 12px;color:#334155;font-size:15px;line-height:1.7;\">"
                    + "Un administrador de SKD solicitó modificar los siguientes datos de tu cuenta:</p>"
                    + "<div style=\"background:#eef2ff;border-radius:12px;padding:16px;margin:0 0 12px;"
                    + "color:#3730a3;font-size:14px;line-height:1.7;\">"
                    + (resumenCambios == null ? "" : resumenCambios) + "</div>"
                    + "<p style=\"margin:0 0 16px;color:#334155;font-size:15px;\">"
                    + "<strong>Ningún dato se modificará hasta que confirmes.</strong></p>"
                    + botonHtml(urlAprobar, "✓ Aprobar cambio", "#16a34a")
                    + botonHtml(urlRechazar, "✕ Rechazar cambio", "#dc2626")
                    + "<p style=\"margin:0;color:#64748b;font-size:13px;line-height:1.6;\">"
                    + "Si no fuiste tú quien solicitó este cambio, puedes ignorar este correo o pulsar "
                    + "\"Rechazar cambio\". Este enlace es válido por 48 horas.</p>";

            enviarCore(correo, "Confirmación de cambio de tus datos - SKD", plantillaHtml(cuerpo), null, null, null);
            log.info("Correo de confirmación de cambio enviado a {}", correo);
        } catch (Exception e) {
            log.error("No se pudo enviar el correo de confirmación de cambio a {}: {}", correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarNotificacion(String correo, String nombre, String titulo, String mensaje) {
        try {
            String texto = "Hola " + nombre + ",\n\n"
                    + mensaje + "\n\n"
                    + "Puedes ver el detalle desde tu bandeja de entrada en SKD.";
            enviarCore(correo, "SKD - " + titulo, null, texto, null, null);
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
            String url = frontendUrl + "/pedidos/" + pedidoId + "/seguimiento";
            String texto = "Hola " + nombre + ",\n\n"
                    + "Tu pedido #" + pedidoId + " ahora está: " + label + ".\n\n"
                    + "Puedes hacer seguimiento en vivo aquí:\n"
                    + url + "\n\nGracias por confiar en SKD.";
            String cuerpo = "<h2 style=\"margin:0 0 8px;color:#0f172a;font-size:20px;\">Hola "
                    + esc(nombre) + ",</h2>"
                    + "<p style=\"margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;\">"
                    + "Tu pedido <strong>#" + pedidoId + "</strong> ahora está:</p>"
                    + "<div style=\"display:inline-block;background:#eef2ff;color:#3730a3;"
                    + "border-radius:999px;padding:10px 22px;font-size:15px;font-weight:700;"
                    + "margin:0 0 20px;\">" + esc(label == null ? estado : label) + "</div><br/>"
                    + botonHtml(url, "Ver seguimiento", MARCA_PRIMARIO)
                    + "<p style=\"margin:0;color:#64748b;font-size:13px;\">Gracias por confiar en SKD.</p>";
            enviarCore(correo, "SKD - Tu pedido #" + pedidoId + " está " + label, plantillaHtml(cuerpo), texto, null, null);
            log.info("Correo de estado enviado a {} para pedido #{} (estado {})", correo, pedidoId, estado);
        } catch (Exception e) {
            log.error("No se pudo enviar el correo de estado del pedido #{} a {}: {}", pedidoId, correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarPasswordCambiada(String correo, String nombre) {
        try {
            String texto = "Hola " + nombre + ",\n\n"
                    + "Te confirmamos que tu contraseña de SKD fue actualizada correctamente.\n\n"
                    + "Si no fuiste tú, contacta con nosotros lo antes posible desde la página de contacto.";
            enviarCore(correo, "SKD - Tu contraseña fue cambiada", null, texto, null, null);
            log.info("Correo de cambio de contraseña enviado a {}", correo);
        } catch (Exception e) {
            log.error("No se pudo enviar el correo de cambio de contraseña a {}: {}", correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarCodigoCancelacionCuenta(String correo, String nombre, String codigo) {
        try {
            String texto = "Hola " + nombre + ",\n\n"
                    + "Recibimos una solicitud para CANCELAR tu cuenta de SKD.\n\n"
                    + "Tu código de verificación es:\n\nCÓDIGO: " + codigo + "\n\n"
                    + "Ingrésalo en la web para confirmar que deseas continuar (válido por 15 minutos).\n\n"
                    + "Si NO solicitaste cancelar tu cuenta, ignora este correo y tu cuenta permanecerá intacta.\n\n"
                    + "Este código es distinto al de verificación de email o reseteo de contraseña.";
            enviarCore(correo, "SKD - Código para cancelar tu cuenta", null, texto, null, null);
            log.info("Correo de código de cancelación enviado a {}", correo);
        } catch (Exception e) {
            log.error("No se pudo enviar el correo de cancelación a {}: {}", correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarCuentaEliminada(String correo, String nombre) {
        try {
            String texto = "Hola " + nombre + ",\n\n"
                    + "Te confirmamos que tu cuenta de SKD ha sido eliminada permanentemente, "
                    + "junto con tus diseños, pedidos, direcciones y todo tu historial.\n\n"
                    + "Lamentamos verte partir. Si fue un error, puedes crear una nueva cuenta en cualquier momento.\n\n"
                    + "Gracias por haber sido parte de SKD.";
            enviarCore(correo, "SKD - Tu cuenta ha sido eliminada", null, texto, null, null);
            log.info("Correo de cuenta eliminada enviado a {}", correo);
        } catch (Exception e) {
            log.error("No se pudo enviar el correo de cuenta eliminada a {}: {}", correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarCodigoRegistro(String correo, String codigo) {
        try {
            String texto = "Gracias por registrarte en SKD.\n\n"
                    + "Tu código de verificación es:\n\nCÓDIGO: " + codigo + "\n\n"
                    + "Ingrésalo en el formulario de registro para confirmar tu correo "
                    + "(válido por 5 minutos).\n\n"
                    + "Si no solicitaste crear una cuenta en SKD, ignora este correo.";
            String cuerpo = "<p style=\"margin:0 0 8px;color:#334155;font-size:15px;line-height:1.7;\">"
                    + "Gracias por registrarte en SKD. Confirma tu correo con este código "
                    + "(válido por <strong>5 minutos</strong>):</p>"
                    + "<div style=\"background:#eef2ff;border:1px dashed #c7d2fe;border-radius:14px;"
                    + "padding:20px;text-align:center;margin:0 0 20px;\">"
                    + "<div style=\"color:#64748b;font-size:12px;letter-spacing:1px;\">TU CÓDIGO DE VERIFICACIÓN</div>"
                    + "<div style=\"font-family:Consolas,Menlo,monospace;font-size:34px;font-weight:800;"
                    + "letter-spacing:8px;color:" + MARCA_PRIMARIO + ";margin-top:8px;\">" + esc(codigo) + "</div>"
                    + "</div>"
                    + "<p style=\"margin:0;color:#64748b;font-size:13px;line-height:1.6;\">"
                    + "Si no solicitaste crear una cuenta en SKD, ignora este correo.</p>";
            enviarCore(correo, "SKD - Tu código de verificación", plantillaHtml(cuerpo), texto, null, null);
            log.info("Código de registro enviado a {}", correo);
        } catch (Exception e) {
            log.error("No se pudo enviar el código de registro a {}: {}", correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarVerificacionEmail(String correo, String nombre, String token) {
        try {
            String url = frontendUrl + "/verificar-email?token=" + token;
            String texto = "Hola " + nombre + ",\n\n"
                    + "Tu código de verificación de SKD es:\n\nCÓDIGO: " + token + "\n\n"
                    + "Ingrésalo en la sección 'Verifica tu correo' de tu panel para confirmar tu cuenta "
                    + "(válido por 24 horas).\n\nTambién puedes confirmar desde este enlace:\n"
                    + url + "\n\nSi no creaste una cuenta en SKD, ignora este correo.";
            String cuerpo = "<h2 style=\"margin:0 0 8px;color:#0f172a;font-size:20px;\">Hola "
                    + esc(nombre) + ",</h2>"
                    + "<p style=\"margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;\">"
                    + "Confirma tu correo con este código (válido por <strong>24 horas</strong>):</p>"
                    + "<div style=\"background:#eef2ff;border:1px dashed #c7d2fe;border-radius:14px;"
                    + "padding:20px;text-align:center;margin:0 0 20px;\">"
                    + "<div style=\"color:#64748b;font-size:12px;letter-spacing:1px;\">TU CÓDIGO DE VERIFICACIÓN</div>"
                    + "<div style=\"font-family:Consolas,Menlo,monospace;font-size:34px;font-weight:800;"
                    + "letter-spacing:8px;color:" + MARCA_PRIMARIO + ";margin-top:8px;\">" + esc(token) + "</div>"
                    + "</div>"
                    + botonHtml(url, "Confirmar correo", MARCA_PRIMARIO)
                    + "<p style=\"margin:0;color:#64748b;font-size:13px;\">Si no creaste una cuenta en SKD, "
                    + "ignora este correo.</p>";
            enviarCore(correo, "SKD - Tu código de verificación", plantillaHtml(cuerpo), texto, null, null);
            log.info("Correo de verificación enviado a {}", correo);
        } catch (Exception e) {
            log.error("No se pudo enviar el correo de verificación a {}: {}", correo, e.getMessage(), e);
        }
    }

    /** Escapa texto para inyectarlo de forma segura dentro del HTML. */
    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
