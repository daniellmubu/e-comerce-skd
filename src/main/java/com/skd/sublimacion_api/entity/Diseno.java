package com.skd.sublimacion_api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "diseno")
@Data
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
}