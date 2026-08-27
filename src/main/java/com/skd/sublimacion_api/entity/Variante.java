package com.skd.sublimacion_api.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Variante de un producto (talla / color / stock / precio opcional).
 *
 * <p>Un producto puede tener varias variantes; si {@code precio} es {@code null}
 * se usa el precio base del producto.
 */
@Entity
@Table(name = "variante")
@Data
@EqualsAndHashCode(of = "id")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Variante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(length = 50)
    private String talla;

    @Column(length = 50)
    private String color;

    @Column(nullable = false)
    @Builder.Default
    private Integer stock = 0;

    @Column(precision = 10, scale = 2)
    private BigDecimal precio;

    @Builder.Default
    private Boolean activo = true;
}
