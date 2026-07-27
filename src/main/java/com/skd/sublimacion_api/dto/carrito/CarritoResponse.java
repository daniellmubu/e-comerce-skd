package com.skd.sublimacion_api.dto.carrito;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CarritoResponse {

    private Long id;

    private Long usuarioId;

    private String usuario;

    private LocalDateTime fechaCreacion;

}