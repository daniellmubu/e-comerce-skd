package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.AuthResponse;
import com.skd.sublimacion_api.dto.LoginRequest;
import com.skd.sublimacion_api.dto.RegistroRequest;
import com.skd.sublimacion_api.dto.cupon.CuponBienvenidaResponse;
import com.skd.sublimacion_api.entity.Cupon;
import com.skd.sublimacion_api.entity.CuponUsuario;
import com.skd.sublimacion_api.entity.PasswordResetToken;
import com.skd.sublimacion_api.entity.Rol;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.repository.CuponRepository;
import com.skd.sublimacion_api.repository.CuponUsuarioRepository;
import com.skd.sublimacion_api.repository.PasswordResetTokenRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
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

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final CuponRepository cuponRepository;
    private final CuponUsuarioRepository cuponUsuarioRepository;

    public AuthResponse registrar(RegistroRequest request) {

        if (usuarioRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Ya existe un usuario con ese username");
        }
        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new IllegalArgumentException("Ya existe un usuario con ese correo");
        }

        Usuario usuario = Usuario.builder()
                .nombre(request.getNombre())
                .username(request.getUsername())
                .correo(request.getCorreo())
                .contrasenaHash(passwordEncoder.encode(request.getPassword()))
                .rol(request.getRol() != null ? request.getRol() : Rol.cliente)
                .build();

        usuarioRepository.save(usuario);

        Cupon cuponBienvenida = crearCuponBienvenida(usuario);

        emailService.enviarBienvenida(usuario.getCorreo(), usuario.getNombre());

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

    public AuthResponse login(LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        Usuario usuario = usuarioRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

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
}