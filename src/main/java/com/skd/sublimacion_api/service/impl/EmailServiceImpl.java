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

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final FacturaPdfService facturaPdfService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

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
}
