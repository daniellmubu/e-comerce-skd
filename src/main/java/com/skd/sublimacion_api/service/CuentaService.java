package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.entity.CuentaCancelacionToken;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.repository.CuentaCancelacionTokenRepository;
import com.skd.sublimacion_api.repository.EmailVerificationTokenRepository;
import com.skd.sublimacion_api.repository.PasswordResetTokenRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CuentaService {

    private static final int CODIGO_EXPIRACION_MINUTOS = 15;
    private static final int VENTANA_VERIFICACION_MINUTOS = 15;

    private final CuentaCancelacionTokenRepository cuentaCancelacionTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public void solicitarCancelacion(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        // Invalida códigos previos de cancelación
        cuentaCancelacionTokenRepository.deleteByUsuario_Id(usuarioId);

        String codigo = generarCodigo6Digitos();

        CuentaCancelacionToken token = CuentaCancelacionToken.builder()
                .token(codigo)
                .usuario(usuario)
                .fechaExpiracion(LocalDateTime.now().plusMinutes(CODIGO_EXPIRACION_MINUTOS))
                .build();

        cuentaCancelacionTokenRepository.save(token);

        emailService.enviarCodigoCancelacionCuenta(usuario.getCorreo(), usuario.getNombre(), codigo);
        log.info("Código de cancelación generado para usuario {} (expira en {} min)", usuarioId, CODIGO_EXPIRACION_MINUTOS);
    }

    @Transactional
    public void verificarCodigo(Long usuarioId, String codigo) {
        String codigoLimpio = codigo == null ? "" : codigo.trim();
        if (codigoLimpio.length() != 6) {
            throw new IllegalArgumentException("El código debe tener 6 dígitos");
        }

        CuentaCancelacionToken token = cuentaCancelacionTokenRepository.findByToken(codigoLimpio)
                .orElseThrow(() -> new IllegalArgumentException("Código incorrecto"));

        // Pertenece al usuario autenticado?
        if (!token.getUsuario().getId().equals(usuarioId)) {
            throw new IllegalArgumentException("Código incorrecto");
        }

        if (Boolean.TRUE.equals(token.getUsado())) {
            throw new IllegalArgumentException("El código ya fue utilizado");
        }

        if (token.getFechaExpiracion().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("El código ha expirado. Solicita uno nuevo");
        }

        token.setUsado(true);
        token.setFechaUso(LocalDateTime.now());
        cuentaCancelacionTokenRepository.save(token);
        log.info("Código de cancelación verificado para usuario {}", usuarioId);
    }

    @Transactional
    public void eliminarCuenta(Long usuarioId) {
        // Debe haber un token usado recientemente (segunda confirmación)
        Optional<CuentaCancelacionToken> opt = cuentaCancelacionTokenRepository
                .findTopByUsuario_IdAndUsadoTrueOrderByFechaUsoDesc(usuarioId);

        CuentaCancelacionToken token = opt.orElseThrow(() ->
                new IllegalArgumentException("Debes verificar el código de cancelación antes de eliminar tu cuenta"));

        if (token.getFechaUso() == null || token.getFechaUso().isBefore(LocalDateTime.now().minusMinutes(VENTANA_VERIFICACION_MINUTOS))) {
            throw new IllegalArgumentException("La verificación ha expirado. Solicita un nuevo código");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        String correo = usuario.getCorreo();
        String nombre = usuario.getNombre();

        // Correo final ANTES de borrar (después no hay registro)
        try {
            emailService.enviarCuentaEliminada(correo, nombre);
        } catch (Exception e) {
            log.warn("No se pudo enviar correo de cuenta eliminada a {}: {}", correo, e.getMessage());
        }

        // Limpieza manual por si no hay ON DELETE CASCADE en todas las FKs
        // Orden: hijos más profundos primero
        try {
            // Referencias a diseno desde otros usuarios (poner a null antes de borrar disenos del usuario)
            entityManager.createNativeQuery("UPDATE item_carrito SET diseno_id = NULL WHERE diseno_id IN (SELECT id FROM diseno WHERE usuario_id = :uid)")
                    .setParameter("uid", usuarioId).executeUpdate();
            entityManager.createNativeQuery("UPDATE item_pedido SET diseno_id = NULL WHERE diseno_id IN (SELECT id FROM diseno WHERE usuario_id = :uid)")
                    .setParameter("uid", usuarioId).executeUpdate();
            entityManager.createNativeQuery("UPDATE solicitud_diseno SET diseno_id = NULL WHERE diseno_id IN (SELECT id FROM diseno WHERE usuario_id = :uid)")
                    .setParameter("uid", usuarioId).executeUpdate();

            // diseno_me_gusta: likes dados por el usuario y likes recibidos en sus diseños
            entityManager.createNativeQuery("DELETE FROM diseno_me_gusta WHERE usuario_id = :uid").setParameter("uid", usuarioId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM diseno_me_gusta WHERE diseno_id IN (SELECT id FROM diseno WHERE usuario_id = :uid)").setParameter("uid", usuarioId).executeUpdate();

            // Personalizaciones -> item_carrito -> carrito
            entityManager.createNativeQuery("DELETE FROM personalizacion WHERE item_carrito_id IN (SELECT ic.id FROM item_carrito ic JOIN carrito c ON ic.carrito_id = c.id WHERE c.usuario_id = :uid)")
                    .setParameter("uid", usuarioId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM item_carrito WHERE carrito_id IN (SELECT id FROM carrito WHERE usuario_id = :uid)")
                    .setParameter("uid", usuarioId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM carrito WHERE usuario_id = :uid").setParameter("uid", usuarioId).executeUpdate();

            // Pedidos: pago, factura, item_pedido -> pedido
            entityManager.createNativeQuery("DELETE FROM pago WHERE pedido_id IN (SELECT id FROM pedido WHERE usuario_id = :uid)").setParameter("uid", usuarioId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM factura WHERE pedido_id IN (SELECT id FROM pedido WHERE usuario_id = :uid)").setParameter("uid", usuarioId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM item_pedido WHERE pedido_id IN (SELECT id FROM pedido WHERE usuario_id = :uid)").setParameter("uid", usuarioId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM pedido WHERE usuario_id = :uid").setParameter("uid", usuarioId).executeUpdate();

            // Otras tablas directas
            entityManager.createNativeQuery("DELETE FROM favorito WHERE usuario_id = :uid").setParameter("uid", usuarioId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM resena WHERE usuario_id = :uid").setParameter("uid", usuarioId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM direccion WHERE usuario_id = :uid").setParameter("uid", usuarioId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM notificacion WHERE usuario_id = :uid").setParameter("uid", usuarioId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM solicitud_diseno WHERE usuario_id = :uid").setParameter("uid", usuarioId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM diseno WHERE usuario_id = :uid").setParameter("uid", usuarioId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM cupon_usuario WHERE usuario_id = :uid").setParameter("uid", usuarioId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM sesion_activa WHERE usuario_id = :uid").setParameter("uid", usuarioId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM cambio_pendiente WHERE usuario_id = :uid").setParameter("uid", usuarioId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM password_reset_token WHERE usuario_id = :uid").setParameter("uid", usuarioId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM email_verification_token WHERE usuario_id = :uid").setParameter("uid", usuarioId).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM cuenta_cancelacion_token WHERE usuario_id = :uid").setParameter("uid", usuarioId).executeUpdate();

            // Referidos: usuarios que fueron referidos por este usuario -> poner a null
            entityManager.createNativeQuery("UPDATE usuario SET referido_por_id = NULL WHERE referido_por_id = :uid").setParameter("uid", usuarioId).executeUpdate();

            entityManager.flush();
        } catch (Exception e) {
            log.warn("Limpieza manual previa al borrado de usuario {} falló parcialmente: {}", usuarioId, e.getMessage());
            // No abortamos: intentamos igualmente el delete; si falla por FK, la excepción se propagará
        }

        // Borrado final del usuario - con CASCADE faltante ya limpiamos, debería funcionar
        usuarioRepository.delete(usuario);
        usuarioRepository.flush();
        log.info("Cuenta eliminada permanentemente usuarioId={} correo={}", usuarioId, correo);
    }

    private String generarCodigo6Digitos() {
        SecureRandom random = new SecureRandom();
        String codigo;
        do {
            codigo = String.format("%06d", random.nextInt(1_000_000));
        } while (cuentaCancelacionTokenRepository.findByToken(codigo).isPresent());
        return codigo;
    }
}
