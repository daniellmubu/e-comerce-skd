package com.skd.sublimacion_api.entity;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "producto")
@Data
@EqualsAndHashCode(of = "id")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    @Builder.Default
    private Integer stock = 0;

    @Builder.Default
    private Boolean activo = true;

    @Column(name = "mas_vendido")
    @Builder.Default
    private Boolean masVendido = false;
}