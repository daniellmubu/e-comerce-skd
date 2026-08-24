package com.skd.sublimacion_api.dto.solicitud;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CambiosSolicitudRequest {

    @NotBlank(message = "El motivo de los cambios es obligatorio")
    private String motivo;
}