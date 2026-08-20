package com.skd.sublimacion_api.dto.cupon;

import lombok.Data;

@Data
public class AsignarCuponRequest {

    private Long usuarioId;

    private Boolean asignarATodos;
}