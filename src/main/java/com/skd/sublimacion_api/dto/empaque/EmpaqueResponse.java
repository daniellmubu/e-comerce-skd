package com.skd.sublimacion_api.dto.empaque;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class EmpaqueResponse {

    private Long id;

    private String tipo;

    private String descripcion;

    private BigDecimal costoAdicional;

}