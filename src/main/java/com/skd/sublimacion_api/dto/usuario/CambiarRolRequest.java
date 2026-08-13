package com.skd.sublimacion_api.dto.usuario;

import com.skd.sublimacion_api.entity.Rol;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CambiarRolRequest {

    @NotNull(message = "El rol es obligatorio")
    private Rol rol;

}