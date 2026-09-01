package com.skd.sublimacion_api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * "Me gusta" de un usuario hacia un diseño publicado en la galería pública.
 * La restricción única (diseno_id, usuario_id) evita likes duplicados.
 */
@Entity
@Table(
        name = "diseno_me_gusta",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_diseno_usuario",
                columnNames = {"diseno_id", "usuario_id"}
        )
)
@Data
@EqualsAndHashCode(of = "id")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisenoMeGusta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "diseno_id", nullable = false)
    private Diseno diseno;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @PrePersist
    protected void alCrear() {
        if (creadoEn == null) {
            creadoEn = LocalDateTime.now();
        }
    }
}
