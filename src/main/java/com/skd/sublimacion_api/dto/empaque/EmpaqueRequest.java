package com.skd.sublimacion_api.dto.empaque;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class EmpaqueRequest {

    private String tipo;

    private String descripcion;

    private BigDecimal costoAdicional;

}