package com.skd.sublimacion_api.dto.usuario;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UsuarioResponse {

    private Long id;

    private String nombre;

    private String username;

    private String correo;

    private String telefono;

    private Boolean verificado;

    private Boolean bloqueado;

    private String rol;
}