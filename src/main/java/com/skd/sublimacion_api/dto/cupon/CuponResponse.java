package com.skd.sublimacion_api.dto.cupon;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class CuponResponse {

    private Long id;

    private String codigo;

    private BigDecimal descuentoPorcentaje;

    private LocalDate fechaInicio;

    private LocalDate fechaFin;

    private Integer usosMaximos;

    private Integer usosActuales;

    private Boolean activo;

    private Boolean esUnicoPorUsuario;

    private BigDecimal montoMinimo;

}