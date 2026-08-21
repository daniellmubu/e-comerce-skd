package com.skd.sublimacion_api.dto.personalizacion;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalizacionResponse {

    private Long id;

    private Long itemCarritoId;

    private String imagenUrl;

    private String texto;

    private Integer rotacion;

    private Double escala;

    private BigDecimal costoAdicional;
}
