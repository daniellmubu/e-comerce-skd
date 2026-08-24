package com.skd.sublimacion_api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Solicitud de diseño asistido por una persona real de SKD (diseñador).
 *
 * Flujo de estados:
 *   RECIBIDA -> EN_DISENO -> PROPUESTA_ENVIADA
 *     -> (cliente aprueba)  LISTA_PARA_PRODUCCION
 *     -> (cliente pide cambios) CAMBIOS_SOLICITADOS -> EN_DISENO -> ...
 *
 * El diseño final aprobado se materializa en la entidad Diseno con
 * origen = CONTACTO_EMPRESA.
 */
@Entity
@Table(name = "solicitud_diseno")
@Data
@EqualsAndHashCode(of = "id")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SolicitudDiseno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "referencia_imagen_url", columnDefinition = "TEXT")
    private String referenciaImagenUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoSolicitudDiseno estado;

    @Column(name = "propuesta_imagen_url", columnDefinition = "TEXT")
    private String propuestaImagenUrl;

    @Column(name = "mensaje_admin", columnDefinition = "TEXT")
    private String mensajeAdmin;

    @Column(name = "motivo_cambios", columnDefinition = "TEXT")
    private String motivoCambios;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diseno_id")
    private Diseno diseno;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @Column(name = "actualizado_en")
    private LocalDateTime actualizadoEn;

    @PrePersist
    protected void alCrear() {
        LocalDateTime ahora = LocalDateTime.now();
        if (creadoEn == null) creadoEn = ahora;
        if (actualizadoEn == null) actualizadoEn = ahora;
    }

    @PreUpdate
    protected void alActualizar() {
        actualizadoEn = LocalDateTime.now();
    }
}