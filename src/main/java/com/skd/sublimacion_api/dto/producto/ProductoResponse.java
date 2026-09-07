package com.skd.sublimacion_api.dto.producto;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductoResponse {

    private Long id;

    private String nombre;

    private String descripcion;

    private BigDecimal precio;

    private Integer stock;

    private Boolean activo;

    private Boolean masVendido;

    private String categoria;

    private Double promedioCalificacion;

    private Long cantidadResenas;

    private Boolean esFavorito;

    private String imagenUrl;

    /**
     * Indica si el producto gestiona su inventario por variantes (talla/color).
     * Cuando es {@code true}, el stock operativo real es la suma de las variantes.
     */
    private Boolean tieneVariantes;

    /**
     * Stock efectivo disponible para el módulo de administración: si el producto
     * tiene variantes, es la suma del stock de sus variantes; si no, es su propio stock.
     */
    private Integer stockEfectivo;

}