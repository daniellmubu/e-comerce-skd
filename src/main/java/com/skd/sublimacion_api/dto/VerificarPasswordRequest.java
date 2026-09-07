package com.skd.sublimacion_api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerificarPasswordRequest {

    @NotBlank(message = "La contraseña actual es obligatoria")
    private String passwordActual;
}
