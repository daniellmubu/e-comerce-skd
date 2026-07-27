package com.skd.sublimacion_api.dto.cupon;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CuponRequest {

    private String codigo;

    private BigDecimal descuentoPorcentaje;

    private LocalDate fechaInicio;

    private LocalDate fechaFin;

    private Integer usosMaximos;

    private Boolean activo;

}