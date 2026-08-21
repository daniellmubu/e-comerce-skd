package com.skd.sublimacion_api.dto.tarifa;

import java.math.BigDecimal;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class TarifaEnvioRequest {

    @NotBlank(message = "El departamento es obligatorio")
    private String departamento;

    @NotNull(message = "El costo base es obligatorio")
    @PositiveOrZero(message = "El costo base no puede ser negativo")
    private BigDecimal costoBase;

    @NotNull(message = "Los días estimados son obligatorios")
    @Min(value = 1, message = "Los días estimados deben ser al menos 1")
    private Integer diasEstimados;
}