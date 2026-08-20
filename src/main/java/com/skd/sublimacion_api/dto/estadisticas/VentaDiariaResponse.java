package com.skd.sublimacion_api.dto.estadisticas;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class VentaDiariaResponse {

    private LocalDate fecha;

    private BigDecimal total;
}