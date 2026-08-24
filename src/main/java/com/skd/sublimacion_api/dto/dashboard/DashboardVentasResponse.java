package com.skd.sublimacion_api.dto.dashboard;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class DashboardVentasResponse {

    private List<VentaPeriodoResponse> anual;

    private List<VentaPeriodoResponse> mensual;

    private List<VentaPeriodoResponse> semanal;

    private BigDecimal ventasAnioActual;

    private BigDecimal ventasMesActual;

    private BigDecimal ventasSemanaActual;
}
