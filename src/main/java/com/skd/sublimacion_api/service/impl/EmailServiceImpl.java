package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.event.CheckoutCompletadoEvent;
import com.skd.sublimacion_api.service.EmailService;
import com.skd.sublimacion_api.service.FacturaPdfService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final FacturaPdfService facturaPdfService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String correoDestino;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Async
    @Override
    public void enviarFacturaCompra(CheckoutCompletadoEvent evento) {

        try {
            byte[] pdf = facturaPdfService.generarPdf(evento.getFacturaId());

            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");

            helper.setTo(evento.getCorreo());
            helper.setSubject("Tu compra en SKD - Factura " + evento.getNumeroFactura());
            helper.setText("Hola " + evento.getNombre() + ",\n\n"
                    + "Gracias por tu compra en SKD. Adjunta encontrarás la factura electrónica "
                    + evento.getNumeroFactura() + ".\n\n"
                    + "¡Que lo disfrutes!");

            helper.addAttachment(evento.getNumeroFactura() + ".pdf",
                    new ByteArrayResource(pdf), "application/pdf");

            mailSender.send(mensaje);
            log.info("Correo de confirmación de compra enviado a {}", evento.getCorreo());

        } catch (MessagingException | RuntimeException e) {
            log.error("No se pudo enviar el correo de la factura {}: {}",
                    evento.getNumeroFactura(), e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarBienvenida(String correo, String nombre) {

        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, false, "UTF-8");

            helper.setTo(correo);
            helper.setSubject("Bienvenido a SKD");
            helper.setText("Hola " + nombre + ",\n\n"
                    + "Gracias por registrarte en SKD - Sublimación de Sueños.\n"
                    + "Ya puedes explorar nuestro catálogo, crear tus propios diseños y "
                    + "realizar tu primera compra.\n\n"
                    + "¡Nos alegra tenerte con nosotros!");

            mailSender.send(mensaje);
            log.info("Correo de bienvenida enviado a {}", correo);

        } catch (MessagingException | RuntimeException e) {
            log.error("No se pudo enviar el correo de bienvenida a {}: {}",
                    correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarRestablecerPassword(String correo, String nombre, String token) {

        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, false, "UTF-8");

            helper.setTo(correo);
            helper.setSubject("Restablece tu contraseña - SKD");
            helper.setText("Hola " + nombre + ",\n\n"
                    + "Recibimos una solicitud para restablecer tu contraseña. "
                    + "Usa el siguiente enlace (válido por 30 minutos):\n\n"
                    + frontendUrl + "/restablecer-password?token=" + token + "\n\n"
                    + "Si no solicitaste este cambio, ignora este correo.");

            mailSender.send(mensaje);
            log.info("Correo de restablecimiento de contraseña enviado a {}", correo);

        } catch (MessagingException | RuntimeException e) {
            log.error("No se pudo enviar el correo de restablecimiento a {}: {}",
                    correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarConfirmacionCambioDatos(
            String correo,
            String nombre,
            String resumenCambios,
            String token,
            String baseUrl) {

        try {
            String urlAprobar = baseUrl + "/api/usuarios/cambios/aprobar?token=" + token;
            String urlRechazar = baseUrl + "/api/usuarios/cambios/rechazar?token=" + token;

            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");

            helper.setTo(correo);
            helper.setSubject("Confirmación de cambio de tus datos - SKD");

            String html = "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;\">"
                    + "<h2 style=\"color:#4f46e5;\">Hola " + nombre + ",</h2>"
                    + "<p>Un administrador de SKD solicitó modificar los siguientes datos de tu cuenta:</p>"
                    + "<div style=\"background:#eef2ff;border-radius:8px;padding:16px;margin:16px 0;\">"
                    + resumenCambios
                    + "</div>"
                    + "<p><strong>Ningún dato se modificará hasta que confirmes.</strong></p>"
                    + "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:24px 0;\">"
                    + "<tr>"
                    + "<td style=\"background:#16a34a;border-radius:8px;\">"
                    + "<a href=\"" + urlAprobar + "\" style=\"display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-weight:bold;\">Aprobar cambio</a>"
                    + "</td>"
                    + "<td style=\"width:12px;\"></td>"
                    + "<td style=\"background:#dc2626;border-radius:8px;\">"
                    + "<a href=\"" + urlRechazar + "\" style=\"display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-weight:bold;\">Rechazar cambio</a>"
                    + "</td>"
                    + "</tr>"
                    + "</table>"
                    + "<p style=\"font-size:12px;color:#6b7280;\">Si no fuiste tú quien solicitó este cambio, puedes ignorar este correo o pulsar \"Rechazar cambio\". "
                    + "Este enlace es válido por 48 horas.</p>"
                    + "</div>";

            helper.setText(html, true);

            mailSender.send(mensaje);
            log.info("Correo de confirmación de cambio enviado a {}", correo);

        } catch (MessagingException | RuntimeException e) {
            log.error("No se pudo enviar el correo de confirmación de cambio a {}: {}",
                    correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarNotificacion(String correo, String nombre, String titulo, String mensaje) {

        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, false, "UTF-8");

            helper.setTo(correo);
            helper.setSubject("SKD - " + titulo);
            helper.setText("Hola " + nombre + ",\n\n" + mensaje + "\n\n"
                    + "Puedes ver el detalle desde tu bandeja de entrada en SKD.");

            mailSender.send(mime);
            log.info("Notificación enviada por correo a {}", correo);

        } catch (MessagingException | RuntimeException e) {
            log.error("No se pudo enviar la notificación a {}: {}",
                    correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarContacto(String nombre, String correo, String asunto, String mensaje) {

        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, false, "UTF-8");

            // El mensaje del formulario llega a la bandeja del negocio.
            helper.setTo(correoDestino);
            helper.setSubject("[Contacto SKD] " + (asunto == null || asunto.isBlank() ? "Mensaje desde la web" : asunto));
            helper.setText("Nuevo mensaje desde la página de contacto:\n\n"
                    + "Nombre: " + nombre + "\n"
                    + "Correo: " + correo + "\n"
                    + "Asunto: " + (asunto == null || asunto.isBlank() ? "—" : asunto) + "\n\n"
                    + mensaje + "\n\n"
                    + "Responder directamente a: " + correo);

            mailSender.send(mime);
            log.info("Mensaje de contacto recibido de {}", correo);

        } catch (MessagingException | RuntimeException e) {
            log.error("No se pudo procesar el mensaje de contacto de {}: {}",
                    correo, e.getMessage(), e);
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

            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, false, "UTF-8");

            helper.setTo(correo);
            helper.setSubject("SKD - Tu pedido #" + pedidoId + " está " + label);
            helper.setText("Hola " + nombre + ",\n\n"
                    + "Tu pedido #" + pedidoId + " ahora está: " + label + ".\n\n"
                    + "Puedes hacer seguimiento en vivo aquí:\n"
                    + frontendUrl + "/pedidos/" + pedidoId + "/seguimiento\n\n"
                    + "Gracias por confiar en SKD.");

            mailSender.send(mime);
            log.info("Correo de estado enviado a {} para pedido #{} (estado {})",
                    correo, pedidoId, estado);

        } catch (MessagingException | RuntimeException e) {
            log.error("No se pudo enviar el correo de estado del pedido #{} a {}: {}",
                    pedidoId, correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarPasswordCambiada(String correo, String nombre) {

        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, false, "UTF-8");

            helper.setTo(correo);
            helper.setSubject("SKD - Tu contraseña fue cambiada");
            helper.setText("Hola " + nombre + ",\n\n"
                    + "Te confirmamos que tu contraseña de SKD fue actualizada correctamente.\n\n"
                    + "Si no fuiste tú, contacta con nosotros lo antes posible desde la página de contacto.");

            mailSender.send(mime);
            log.info("Correo de cambio de contraseña enviado a {}", correo);

        } catch (MessagingException | RuntimeException e) {
            log.error("No se pudo enviar el correo de cambio de contraseña a {}: {}",
                    correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarCodigoCancelacionCuenta(String correo, String nombre, String codigo) {

        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, false, "UTF-8");

            helper.setTo(correo);
            helper.setSubject("SKD - Código para cancelar tu cuenta");
            helper.setText("Hola " + nombre + ",\n\n"
                    + "Recibimos una solicitud para CANCELAR tu cuenta de SKD.\n\n"
                    + "Tu código de verificación es:\n\n"
                    + "CÓDIGO: " + codigo + "\n\n"
                    + "Ingrésalo en la web para confirmar que deseas continuar (válido por 15 minutos).\n\n"
                    + "Si NO solicitaste cancelar tu cuenta, ignora este correo y tu cuenta permanecerá intacta.\n\n"
                    + "Este código es distinto al de verificación de email o reseteo de contraseña.");

            mailSender.send(mime);
            log.info("Correo de código de cancelación enviado a {}", correo);

        } catch (MessagingException | RuntimeException e) {
            log.error("No se pudo enviar el correo de cancelación a {}: {}",
                    correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarCuentaEliminada(String correo, String nombre) {

        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, false, "UTF-8");

            helper.setTo(correo);
            helper.setSubject("SKD - Tu cuenta ha sido eliminada");
            helper.setText("Hola " + nombre + ",\n\n"
                    + "Te confirmamos que tu cuenta de SKD ha sido eliminada permanentemente, "
                    + "junto con tus diseños, pedidos, direcciones y todo tu historial.\n\n"
                    + "Lamentamos verte partir. Si fue un error, puedes crear una nueva cuenta en cualquier momento.\n\n"
                    + "Gracias por haber sido parte de SKD.");

            mailSender.send(mime);
            log.info("Correo de cuenta eliminada enviado a {}", correo);

        } catch (MessagingException | RuntimeException e) {
            log.error("No se pudo enviar el correo de cuenta eliminada a {}: {}",
                    correo, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void enviarVerificacionEmail(String correo, String nombre, String token) {

        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, false, "UTF-8");

            helper.setTo(correo);
            helper.setSubject("SKD - Tu código de verificación");
            helper.setText("Hola " + nombre + ",\n\n"
                    + "Tu código de verificación de SKD es:\n\n"
                    + "CÓDIGO: " + token + "\n\n"
                    + "Ingrésalo en la sección 'Verifica tu correo' de tu panel para "
                    + "confirmar tu cuenta (válido por 24 horas).\n\n"
                    + "También puedes confirmar desde este enlace:\n"
                    + frontendUrl + "/verificar-email?token=" + token + "\n\n"
                    + "Si no creaste una cuenta en SKD, ignora este correo.");

            mailSender.send(mime);
            log.info("Correo de verificación enviado a {}", correo);

        } catch (MessagingException | RuntimeException e) {
            log.error("No se pudo enviar el correo de verificación a {}: {}",
                    correo, e.getMessage(), e);
        }
    }
}
