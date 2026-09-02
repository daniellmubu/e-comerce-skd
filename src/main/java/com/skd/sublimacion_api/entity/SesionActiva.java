package com.skd.sublimacion_api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Sesión activa emitida al iniciar sesión (token JWT con jti).
 * Permite listar los dispositivos con la cuenta abierta y revocar
 * remotamente cualquier sesión (cierres desde el panel admin).
 */
@Entity
@Table(name = "sesion_activa")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SesionActiva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    /** Identificador único del JWT de acceso (claim jti). */
    @Column(name = "token_jti", nullable = false, unique = true, length = 64)
    private String tokenJti;

    /** User-Agent del navegador/dispositivo que abrió la sesión. */
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "ip", length = 64)
    private String ip;

    /** Nombre amigable del sistema operativo/dispositivo (p. ej. "Windows"). */
    @Column(length = 120)
    private String dispositivo;

    /** Nombre amigable del navegador (p. ej. "Chrome"). */
    @Column(length = 160)
    private String navegador;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;

    @Column(name = "expira_en", nullable = false)
    private LocalDateTime expiraEn;

    /** true cuando la sesión fue cerrada remotamente (el token deja de valer). */
    @Builder.Default
    @Column(nullable = false)
    private Boolean revocada = false;
}
