package com.skd.sublimacion_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestablecerPasswordRequest {

    @NotBlank(message = "El token es obligatorio")
    private String token;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "La contraseña debe contener al menos una letra y un número")
    private String password;
}