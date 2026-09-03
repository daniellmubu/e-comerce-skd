package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.AuthResponse;
import com.skd.sublimacion_api.dto.LoginRequest;
import com.skd.sublimacion_api.dto.RegistroRequest;
import com.skd.sublimacion_api.dto.cupon.CuponBienvenidaResponse;
import com.skd.sublimacion_api.entity.Cupon;
import com.skd.sublimacion_api.entity.CuponUsuario;
import com.skd.sublimacion_api.entity.EmailVerificationToken;
import com.skd.sublimacion_api.entity.PasswordResetToken;
import com.skd.sublimacion_api.entity.Rol;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.exeption.ForbiddenException;
import com.skd.sublimacion_api.repository.CuponRepository;
import com.skd.sublimacion_api.repository.CuponUsuarioRepository;
import com.skd.sublimacion_api.repository.EmailVerificationTokenRepository;
import com.skd.sublimacion_api.repository.PasswordResetTokenRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    /** Nº de intentos de login fallidos antes de bloquear la cuenta. */
    private static final int MAX_INTENTOS_FALLIDOS = 5;

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final CuponRepository cuponRepository;
    private final CuponUsuarioRepository cuponUsuarioRepository;

    public AuthResponse registrar(RegistroRequest request) {

        if (usuarioRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Ya existe un usuario con ese username");
        }
        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new IllegalArgumentException("Ya existe un usuario con ese correo");
        }

        Usuario referidoPor = null;
        if (request.getCodigoReferido() != null && !request.getCodigoReferido().isBlank()) {
            referidoPor = usuarioRepository.findByCodigoReferido(request.getCodigoReferido().trim().toUpperCase()).orElse(null);
        }

        Usuario usuario = Usuario.builder()
                .nombre(request.getNombre())
                .username(request.getUsername())
                .correo(request.getCorreo())
                .contrasenaHash(passwordEncoder.encode(request.getPassword()))
                // El registro público SIEMPRE crea clientes. El rol nunca se toma
                // del request (escalamiento de privilegios): admin/disenador solo
                // pueden crearse por un admin autenticado en /api/admin/usuarios.
                .rol(Rol.cliente)
                .referidoPor(referidoPor)
                .codigoReferido(generarCodigoReferido(request.getUsername()))
                .build();

        usuarioRepository.save(usuario);

        Cupon cuponBienvenida = crearCuponBienvenida(usuario);

        emailService.enviarBienvenida(usuario.getCorreo(), usuario.getNombre());
        crearTokenVerificacionYEnviar(usuario);

        String token = jwtService.generateToken(usuario);
        String refreshToken = jwtService.generateRefreshToken(usuario);

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .username(usuario.getUsername())
                .correo(usuario.getCorreo())
                .rol(usuario.getRol().name())
                .verificado(usuario.getVerificado())
                .creadoEn(usuario.getCreadoEn())
                .cuponBienvenida(CuponBienvenidaResponse.builder()
                        .codigo(cuponBienvenida.getCodigo())
                        .descuentoPorcentaje(cuponBienvenida.getDescuentoPorcentaje())
                        .fechaVencimiento(cuponBienvenida.getFechaFin())
                        .build())
                .build();
    }

    private Cupon crearCuponBienvenida(Usuario usuario) {

        Cupon cupon = Cupon.builder()
                .codigo("BIENVENIDA-" + usuario.getId())
                .descuentoPorcentaje(new BigDecimal("10"))
                .fechaInicio(LocalDate.now())
                .fechaFin(LocalDate.now().plusDays(30))
                .usosMaximos(1)
                .activo(true)
                .esUnicoPorUsuario(true)
                .build();

        cuponRepository.save(cupon);

        cuponUsuarioRepository.save(CuponUsuario.builder()
                .cupon(cupon)
                .usuario(usuario)
                .build());

        return cupon;
    }

    private String generarCodigoReferido(String username) {
        String base = username.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        base = base.length() >= 3 ? base.substring(0, 3) : String.format("%-3s", base).replace(' ', 'X');
        String alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        java.security.SecureRandom random = new java.security.SecureRandom();
        String codigo;
        int intentos = 0;
        do {
            StringBuilder sb = new StringBuilder("SKD-").append(base).append("-");
            for (int i = 0; i < 4; i++) sb.append(alfabeto.charAt(random.nextInt(alfabeto.length())));
            codigo = sb.toString();
            intentos++;
            if (intentos > 10) throw new IllegalStateException("No se pudo generar código referido");
        } while (usuarioRepository.findByCodigoReferido(codigo).isPresent());
        return codigo;
    }

    public AuthResponse login(LoginRequest request) {

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );
        } catch (LockedException ex) {
            // isAccountNonLocked() -> false cuando el usuario está bloqueado.
            throw new ForbiddenException(
                    "Cuenta bloqueada por múltiples intentos fallidos. Contacta al administrador."
            );
        } catch (BadCredentialsException ex) {
            // Registramos el intento fallido del usuario (si existe), y lo
            // bloqueamos al superar el máximo permitido. Se relanza el 401.
            usuarioRepository.findByUsername(request.getUsername()).ifPresent(u -> {
                int intentos = (u.getIntentosFallidos() == null ? 0 : u.getIntentosFallidos()) + 1;
                u.setIntentosFallidos(intentos);
                if (intentos >= MAX_INTENTOS_FALLIDOS) {
                    u.setBloqueado(true);
                }
                usuarioRepository.save(u);
            });
            throw ex;
        }

        Usuario usuario = usuarioRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        // Cuenta registrada pero email aún no verificado → no permitir ingreso
        if (!Boolean.TRUE.equals(usuario.getVerificado())) {
            throw new ForbiddenException(
                    "Debes verificar tu email antes de iniciar sesión. Revisa tu correo y usa el código de verificación."
            );
        }

        // Login exitoso: reiniciamos el contador si quedó con intentos previos.
        if (usuario.getIntentosFallidos() != null && usuario.getIntentosFallidos() > 0) {
            usuario.setIntentosFallidos(0);
            usuarioRepository.save(usuario);
        }

        String token = jwtService.generateToken(usuario);
        String refreshToken = jwtService.generateRefreshToken(usuario);

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .username(usuario.getUsername())
                .correo(usuario.getCorreo())
                .rol(usuario.getRol().name())
                .verificado(usuario.getVerificado())
                .creadoEn(usuario.getCreadoEn())
                .build();
    }

    public void olvidarPassword(String correo) {

        // Respuesta genérica siempre: no se filtra si el correo está registrado.
        usuarioRepository.findByCorreo(correo).ifPresent(usuario -> {
            passwordResetTokenRepository.deleteByUsuario_Id(usuario.getId());

            String token = UUID.randomUUID().toString();

            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .token(token)
                    .usuario(usuario)
                    .fechaExpiracion(LocalDateTime.now().plusMinutes(30))
                    .build();

            passwordResetTokenRepository.save(resetToken);

            emailService.enviarRestablecerPassword(
                    usuario.getCorreo(), usuario.getNombre(), token);
        });
    }

    public void restablecerPassword(String token, String nuevaPassword) {

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException(
                        "El enlace para restablecer la contraseña es inválido"));

        if (Boolean.TRUE.equals(resetToken.getUsado())) {
            throw new IllegalArgumentException("El enlace ya fue utilizado");
        }
        if (resetToken.getFechaExpiracion().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("El enlace ha expirado");
        }

        Usuario usuario = resetToken.getUsuario();
        usuario.setContrasenaHash(passwordEncoder.encode(nuevaPassword));
        usuarioRepository.save(usuario);

        resetToken.setUsado(true);
        resetToken.setFechaUso(LocalDateTime.now());
        passwordResetTokenRepository.save(resetToken);
    }

    public void verificarPasswordActual(Long usuarioId, String passwordActual) {

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (!passwordEncoder.matches(passwordActual, usuario.getContrasenaHash())) {
            throw new IllegalArgumentException("La contraseña actual es incorrecta.");
        }
    }

    public void cambiarPassword(Long usuarioId, String passwordActual, String nuevaPassword) {

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (!passwordEncoder.matches(passwordActual, usuario.getContrasenaHash())) {
            throw new IllegalArgumentException("La contraseña actual es incorrecta.");
        }

        usuario.setContrasenaHash(passwordEncoder.encode(nuevaPassword));
        usuarioRepository.save(usuario);

        emailService.enviarPasswordCambiada(usuario.getCorreo(), usuario.getNombre());
    }

    public void verificarEmail(String token) {

        EmailVerificationToken verificacion = emailVerificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException(
                        "El enlace de verificación es inválido"));

        if (Boolean.TRUE.equals(verificacion.getUsado())) {
            throw new IllegalArgumentException("El enlace ya fue utilizado");
        }
        if (verificacion.getFechaExpiracion().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("El enlace ha expirado");
        }

        Usuario usuario = verificacion.getUsuario();
        usuario.setVerificado(true);
        usuarioRepository.save(usuario);

        verificacion.setUsado(true);
        verificacion.setFechaUso(LocalDateTime.now());
        emailVerificationTokenRepository.save(verificacion);
    }

    public void reenviarVerificacion(String correo) {

        // Respuesta genérica: no se filtra si el correo existe.
        usuarioRepository.findByCorreo(correo).ifPresent(usuario -> {
            if (!Boolean.TRUE.equals(usuario.getVerificado())) {
                emailVerificationTokenRepository.deleteByUsuario_Id(usuario.getId());
                crearTokenVerificacionYEnviar(usuario);
            }
        });
    }

    private void crearTokenVerificacionYEnviar(Usuario usuario) {

        String codigo = generarCodigoVerificacion();

        EmailVerificationToken verificacion = EmailVerificationToken.builder()
                .token(codigo)
                .usuario(usuario)
                .fechaExpiracion(LocalDateTime.now().plusHours(24))
                .build();

        emailVerificationTokenRepository.save(verificacion);

        emailService.enviarVerificacionEmail(
                usuario.getCorreo(), usuario.getNombre(), codigo);
    }

    private String generarCodigoVerificacion() {

        // Código numérico de 6 dígitos: el usuario lo teclea en la web, así
        // no depende de que el enlace del correo tenga la URL correcta.
        java.security.SecureRandom random = new java.security.SecureRandom();
        String codigo;
        do {
            codigo = String.format("%06d", random.nextInt(1_000_000));
        } while (emailVerificationTokenRepository.findByToken(codigo).isPresent());
        return codigo;
    }
}