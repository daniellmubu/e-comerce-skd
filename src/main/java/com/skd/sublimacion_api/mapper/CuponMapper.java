package com.skd.sublimacion_api.mapper;

import org.springframework.stereotype.Component;

import com.skd.sublimacion_api.dto.cupon.CuponResponse;
import com.skd.sublimacion_api.entity.Cupon;

@Component
public class CuponMapper {

    public CuponResponse toResponse(Cupon cupon) {

        if (cupon == null) {
            return null;
        }

        return CuponResponse.builder()
                .id(cupon.getId())
                .codigo(cupon.getCodigo())
                .descuentoPorcentaje(cupon.getDescuentoPorcentaje())
                .fechaInicio(cupon.getFechaInicio())
                .fechaFin(cupon.getFechaFin())
                .usosMaximos(cupon.getUsosMaximos())
                .usosActuales(cupon.getUsosActuales())
                .activo(cupon.getActivo())
                .esUnicoPorUsuario(cupon.getEsUnicoPorUsuario())
                .build();
    }

}