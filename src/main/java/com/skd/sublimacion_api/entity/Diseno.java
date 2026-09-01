package com.skd.sublimacion_api.entity;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "diseno")
@Data
@EqualsAndHashCode(of = "id")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Diseno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id")
    private Producto producto;

    @Column(name = "plantilla_id")
    private Long plantillaId;

    @Column(name = "imagen_url", columnDefinition = "TEXT")
    private String imagenUrl;

    @Column(name = "texto_personalizado")
    private String textoPersonalizado;

    private String fuente;

    @Column(name = "color_texto")
    private String colorTexto;

    @Column(columnDefinition = "TEXT")
    private String prompt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrigenDiseno origen;

    @Builder.Default @Column(nullable = false)
    private Boolean usado = false;

    // ---- Publicación pública (galería de diseños de usuarios) ----
    @Column(length = 120)
    private String titulo;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_publicacion", length = 20)
    private EstadoPublicacionDiseno estadoPublicacion;

    @Column(name = "motivo_rechazo", columnDefinition = "TEXT")
    private String motivoRechazo;

    // Número de veces que el diseño se agregó a un pedido (popularidad por uso).
    @Builder.Default
    @Column(name = "veces_usado", nullable = false)
    private Integer vecesUsado = 0;

    @Column(name = "publicado_en")
    private LocalDateTime publicadoEn;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void alCrear() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}