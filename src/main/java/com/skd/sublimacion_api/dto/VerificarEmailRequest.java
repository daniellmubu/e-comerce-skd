package com.skd.sublimacion_api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerificarEmailRequest {

    @NotBlank(message = "El token de verificación es obligatorio")
    private String token;
}
