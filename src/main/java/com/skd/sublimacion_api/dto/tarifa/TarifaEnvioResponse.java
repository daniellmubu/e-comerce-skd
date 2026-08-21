package com.skd.sublimacion_api.dto.tarifa;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TarifaEnvioResponse {

    private Long id;

    private String departamento;

    private BigDecimal costoBase;

    private Integer diasEstimados;
}