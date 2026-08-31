package com.skd.sublimacion_api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Solicitud de cambio de datos de usuario iniciada por un administrador.
 *
 * Nada se aplica directamente: la solicitud queda pendiente y sólo se aplica
 * cuando el usuario hace clic en el enlace de aprobación enviado a su correo.
 * Esto garantiza que el administrador no modifica datos personales del cliente
 * sin su consentimiento explícito.
 *
 * El rol NO forma parte de estos cambios: sólo se asigna al crear el usuario.
 */
@Entity
@Table(name = "cambio_pendiente")
@Data
@EqualsAndHashCode(of = "id")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CambioPendiente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    /** Valores propuestos (sólo se rellenan los que cambian). */
    private String nombre;

    private String username;

    private String correo;

    private String telefono;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoCambioPendiente estado = EstadoCambioPendiente.PENDIENTE;

    @Column(name = "fecha_expiracion", nullable = false)
    private LocalDateTime fechaExpiracion;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_respuesta")
    private LocalDateTime fechaRespuesta;

    @PrePersist
    public void prePersist() {
        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now();
        }
    }
}
