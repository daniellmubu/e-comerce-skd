package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.sesion.SesionActivaResponse;
import com.skd.sublimacion_api.entity.SesionActiva;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.exeption.ForbiddenException;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.SesionActivaRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Control de sesiones activas basadas en tokens JWT (claim jti).
 * Permite registrar el dispositivo en cada login, validar que el token siga
 * activo en cada petición y revocar sesiones de forma remota.
 */
@Service
@RequiredArgsConstructor
public class SesionActivaService {

    /** Tope de sesiones activas simultáneas por cuenta (se depuran las más viejas). */
    private static final int MAX_SESIONES_POR_USUARIO = 20;

    private final SesionActivaRepository sesionRepository;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;

    /**
     * Registra la sesión del token de acceso recién emitido.
     * Si el mismo navegador (mismo User-Agent) ya tiene una sesión activa, se
     * revoca la anterior para no duplicar el mismo dispositivo.
     */
    @Transactional
    public void registrarSesion(Long usuarioId, String accessToken, String userAgent, String ip) {
        if (usuarioId == null || accessToken == null || accessToken.isBlank()) {
            return;
        }
        String jti = jwtService.extractTokenId(accessToken);
        if (jti == null || jti.isBlank()) {
            return;
        }
        Date expiracion = jwtService.extractExpiration(accessToken);

        Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null) {
            return;
        }

        // Limpia sesiones ya vencidas (de todos los usuarios).
        sesionRepository.deleteByExpiraEnBefore(LocalDateTime.now());

        String ua = userAgent == null ? "" : userAgent;

        // Reemplaza la sesión previa del mismo dispositivo/navegador.
        sesionRepository.findByUsuarioIdAndRevocadaFalse(usuarioId).stream()
                .filter(s -> ua.equals(s.getUserAgent() == null ? "" : s.getUserAgent()))
                .forEach(s -> {
                    s.setRevocada(true);
                    sesionRepository.save(s);
                });

        SesionActiva sesion = SesionActiva.builder()
                .usuario(usuario)
                .tokenJti(jti)
                .userAgent(ua)
                .ip(ip)
                .dispositivo(dispositivoDe(ua))
                .navegador(navegadorDe(ua))
                .creadoEn(LocalDateTime.now())
                .expiraEn(expiracion.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime())
                .revocada(false)
                .build();
        sesionRepository.save(sesion);

        // Evita acumulación excesiva de sesiones de la misma cuenta.
        depurarExceso(usuarioId);
    }

    /** Indica si el jti (token) corresponde a una sesión vigente y no revocada. */
    public boolean esTokenActivo(String jti) {
        if (jti == null || jti.isBlank()) {
            return false;
        }
        Optional<SesionActiva> sesion = sesionRepository.findByTokenJti(jti);
        return sesion.isPresent()
                && !Boolean.TRUE.equals(sesion.get().getRevocada())
                && sesion.get().getExpiraEn().isAfter(LocalDateTime.now());
    }

    /** Lista las sesiones activas de un usuario, marcando cuál es la actual. */
    public List<SesionActivaResponse> listarDe(Long usuarioId, String jtiActual) {
        sesionRepository.deleteByExpiraEnBefore(LocalDateTime.now());
        return sesionRepository.findByUsuarioIdAndRevocadaFalse(usuarioId).stream()
                .map(s -> aResponse(s, jtiActual))
                .sorted(Comparator.comparing(SesionActivaResponse::isEsActual).reversed()
                        .thenComparing(SesionActivaResponse::getCreadoEn, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    /** Revoca la sesión asociada a un jti (logout o cierre remoto por token). */
    public void revocarPorJti(String jti) {
        if (jti == null || jti.isBlank()) {
            return;
        }
        sesionRepository.findByTokenJti(jti).ifPresent(sesion -> {
            sesion.setRevocada(true);
            sesionRepository.save(sesion);
        });
    }

    /** Revoca una sesión concreta (solo si pertenece al usuario indicado). */
    public void revocarSesionDe(Long usuarioId, Long sesionId) {
        SesionActiva sesion = sesionRepository.findById(sesionId)
                .orElseThrow(() -> new ResourceNotFoundException("Sesión no encontrada"));
        if (!sesion.getUsuario().getId().equals(usuarioId)) {
            throw new ForbiddenException("No puedes cerrar una sesión de otra cuenta.");
        }
        sesion.setRevocada(true);
        sesionRepository.save(sesion);
    }

    /** Revoca todas las sesiones del usuario excepto la actual (jti). Devuelve cuántas cerró. */
    @Transactional
    public int revocarTodasMenos(Long usuarioId, String jtiActual) {
        int cerradas = 0;
        for (SesionActiva sesion : sesionRepository.findByUsuarioIdAndRevocadaFalse(usuarioId)) {
            if (!sesion.getTokenJti().equals(jtiActual)) {
                sesion.setRevocada(true);
                sesionRepository.save(sesion);
                cerradas++;
            }
        }
        return cerradas;
    }

    private void depurarExceso(Long usuarioId) {
        List<SesionActiva> activas = sesionRepository.findByUsuarioIdAndRevocadaFalse(usuarioId);
        if (activas.size() <= MAX_SESIONES_POR_USUARIO) {
            return;
        }
        activas.stream()
                .sorted(Comparator.comparing(SesionActiva::getCreadoEn).reversed())
                .skip(MAX_SESIONES_POR_USUARIO)
                .forEach(s -> {
                    s.setRevocada(true);
                    sesionRepository.save(s);
                });
    }

    private SesionActivaResponse aResponse(SesionActiva sesion, String jtiActual) {
        return SesionActivaResponse.builder()
                .id(sesion.getId())
                .dispositivo(sesion.getDispositivo())
                .navegador(sesion.getNavegador())
                .ip(sesion.getIp())
                .creadoEn(sesion.getCreadoEn())
                .expiraEn(sesion.getExpiraEn())
                .esActual(jtiActual != null && jtiActual.equals(sesion.getTokenJti()))
                .build();
    }

    // ---- Parseo básico del User-Agent (sin dependencias externas) ----

    private static String dispositivoDe(String ua) {
        String s = (ua == null ? "" : ua).toLowerCase(Locale.ROOT);
        if (s.contains("iphone") || s.contains("ipad") || s.contains("ios")) return "iOS";
        if (s.contains("android")) return "Android";
        if (s.contains("windows")) return "Windows";
        if (s.contains("macintosh") || s.contains("mac os")) return "macOS";
        if (s.contains("linux")) return "Linux";
        return "Desconocido";
    }

    private static String navegadorDe(String ua) {
        String s = (ua == null ? "" : ua).toLowerCase(Locale.ROOT);
        if (s.contains("edg/") || s.contains("edg ")) return "Microsoft Edge";
        if (s.contains("opr/") || s.contains("opera")) return "Opera";
        if (s.contains("chrome")) return "Chrome";
        if (s.contains("firefox")) return "Firefox";
        if (s.contains("safari")) return "Safari";
        return "Navegador";
    }
}
