package com.skd.sublimacion_api.dto.personalizacion;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PersonalizacionRequest {

    @NotNull
    private Long itemCarritoId;

    private String imagenUrl;

    private String texto;

    private Integer rotacion;

    private Double escala;

    private BigDecimal costoAdicional;
}
