package com.skd.sublimacion_api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Borrador editable del personalizador guardado en la nube (por cuenta).
 * Permite continuar un diseño desde otro dispositivo escaneando un QR:
 * la apertura queda protegida por sesión (solo el dueño de la cuenta).
 */
@Entity
@Table(name = "borrador_editable")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BorradorEditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 160)
    private String nombre;

    /** Snapshot JSON completo del diseño (serializarDisenoEditable del frontend). */
    @Column(name = "snapshot", nullable = false, columnDefinition = "TEXT")
    private String snapshot;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;

    @PrePersist
    protected void alCrear() {
        if (creadoEn == null) {
            creadoEn = LocalDateTime.now();
        }
    }
}
