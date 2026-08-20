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

}