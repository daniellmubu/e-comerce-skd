package com.skd.sublimacion_api.entity;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "personalizacion")
@Data
@EqualsAndHashCode(of = "id")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Personalizacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Cada ítem del carrito tiene como máximo una personalización.
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_carrito_id", nullable = false, unique = true)
    private ItemCarrito itemCarrito;

    // URL de la imagen del diseño (generada por IA o subida por el usuario).
    @Column(name = "imagen_url", columnDefinition = "TEXT")
    private String imagenUrl;

    // Descripción completa de la personalización: incluye el texto escrito,
    // su color, tamaño y posición (X%,Y%), más color del producto, etc.
    @Column(columnDefinition = "TEXT")
    private String texto;

    // Rotación del diseño en grados (0, 90, 180, 270).
    private Integer rotacion;

    // Escala del diseño (1 = 100%, 1.2 = 120%, etc.).
    private Double escala;

    // Costo extra que se cobra por personalizar este producto.
    @Column(name = "costo_adicional", precision = 10, scale = 2)
    private BigDecimal costoAdicional;
}
