package com.skd.sublimacion_api.dto.producto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class ProductoBusquedaRequest {

    private String texto;

    private Long categoriaId;

    private BigDecimal precioMin;

    private BigDecimal precioMax;

    private Double calificacionMinima;

    private String ordenarPor;
}