package com.skd.sublimacion_api.dto.cupon;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsignarCuponResponse {

    private Long cuponId;

    private int asignados;

    private int yaAsignados;
}