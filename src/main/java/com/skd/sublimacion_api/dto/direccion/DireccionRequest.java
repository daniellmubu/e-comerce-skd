package com.skd.sublimacion_api.dto.direccion;

import lombok.Data;

@Data
public class DireccionRequest {

    private Long usuarioId;

    private String calle;

    private String ciudad;

    private String departamento;

    private String codigoPostal;

    private Boolean predeterminada;
}