package com.skd.sublimacion_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CambiarPasswordRequest {

    @NotBlank(message = "Debes ingresar tu contraseña actual")
    private String passwordActual;

    @NotBlank(message = "La nueva contraseña es obligatoria")
    @Size(min = 8, message = "La nueva contraseña debe tener al menos 8 caracteres")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "La nueva contraseña debe contener al menos una letra y un número")
    private String nuevaPassword;
}