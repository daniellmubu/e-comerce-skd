package com.skd.sublimacion_api.dto.dashboard;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ProductoMasVendidoResponse {

    private Long productoId;

    private String producto;

    private Long unidadesVendidas;

    private BigDecimal ingresoTotal;
}
