package com.skd.sublimacion_api.dto.estadisticas;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ResumenEstadisticasResponse {

    private BigDecimal ingresosTotales;

    private Long totalPedidos;

    private BigDecimal ticketPromedio;
}