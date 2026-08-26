package com.skd.sublimacion_api.entity;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.*;

import java.math.BigDecimal;


@Entity
@Table(name = "item_carrito")
@Data
@EqualsAndHashCode(of = "id")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemCarrito{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "carrito_id", nullable = false)
    private Carrito carrito;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diseno_id")
    private Diseno diseno;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variante_id")
    private VarianteProducto variante;

}