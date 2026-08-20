package com.skd.sublimacion_api.dto.cupon;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CuponRequest {

    @NotBlank(message = "El código es obligatorio")
    private String codigo;

    @NotNull(message = "El descuento es obligatorio")
    @DecimalMin(value = "1.0", message = "El descuento debe ser mayor que 0")
    @DecimalMax(value = "100.0", message = "El descuento no puede superar el 100%")
    private BigDecimal descuentoPorcentaje;

    @NotNull(message = "La fecha de inicio es obligatoria")
    private LocalDate fechaInicio;

    @NotNull(message = "La fecha de fin es obligatoria")
    private LocalDate fechaFin;

    @Min(value = 0, message = "Los usos máximos no pueden ser negativos")
    private Integer usosMaximos;

    @NotNull(message = "El estado es obligatorio")
    private Boolean activo;

    private Boolean esUnicoPorUsuario;
}