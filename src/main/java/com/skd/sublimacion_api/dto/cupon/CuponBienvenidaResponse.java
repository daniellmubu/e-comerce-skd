package com.skd.sublimacion_api.dto.cupon;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CuponBienvenidaResponse {

    private String codigo;

    private BigDecimal descuentoPorcentaje;

    private LocalDate fechaVencimiento;
}