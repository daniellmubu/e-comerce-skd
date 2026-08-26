package com.skd.sublimacion_api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "variante_producto")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class VarianteProducto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false, length = 10)
    private String talla;

    @Column(nullable = false, length = 50)
    private String color;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precio;

    @Column(nullable = false)
    private Integer stock;

    @Column(length = 50, unique = true)
    private String sku;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private java.time.LocalDateTime creadoEn;

    @Column(name = "actualizado_en")
    private java.time.LocalDateTime actualizadoEn;

    @PrePersist
    protected void alCrear() {
        if (creadoEn == null) creadoEn = java.time.LocalDateTime.now();
        if (actualizadoEn == null) actualizadoEn = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void alActualizar() {
        actualizadoEn = java.time.LocalDateTime.now();
    }
}