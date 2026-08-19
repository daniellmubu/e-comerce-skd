package com.skd.sublimacion_api.dto.dashboard;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ResumenDashboardResponse {

    private Long totalUsuarios;

    private Long totalProductos;

    private Long totalPedidos;

    private BigDecimal ventasTotales;

    private Long pedidosPendientes;

    private Long pedidosCompletados;

    private Long pedidosCancelados;
}
