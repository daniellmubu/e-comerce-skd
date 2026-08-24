package com.skd.sublimacion_api.dto.solicitud;

import com.skd.sublimacion_api.entity.EstadoSolicitudDiseno;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CambiarEstadoSolicitudRequest {

    @NotNull(message = "El estado es obligatorio")
    private EstadoSolicitudDiseno estado;
}