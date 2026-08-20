package com.skd.sublimacion_api.dto.envio;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EnvioResponse {

    private String departamento;

    private BigDecimal costoEnvio;

    private Integer diasEstimados;

    private Boolean tarifaConfigurada;
}