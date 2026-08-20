package com.skd.sublimacion_api.dto.cupon;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CuponUsuarioResponse {

    private Long id;

    private Long cuponId;

    private String codigo;

    private BigDecimal descuentoPorcentaje;

    private LocalDate fechaFin;

    private Boolean usado;

    private LocalDateTime fechaUso;
}