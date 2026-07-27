package com.skd.sublimacion_api.dto.direccion;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DireccionResponse {

    private Long id;

    private Long usuarioId;

    private String usuario;

    private String calle;

    private String ciudad;

    private String departamento;

    private String codigoPostal;

    private Boolean predeterminada;
}