package com.skd.sublimacion_api.dto.empaque;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class EmpaqueRequest {

    private String tipo;

    private String descripcion;

    private BigDecimal costoAdicional;

    /** URL de la imagen (para conservarla al editar; la subida real es por multipart). */
    private String imagenUrl;

}