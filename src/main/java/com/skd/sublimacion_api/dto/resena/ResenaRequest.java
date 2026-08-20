package com.skd.sublimacion_api.dto.resena;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ResenaRequest {

    @NotNull(message = "El producto es obligatorio")
    private Long productoId;

    @NotNull(message = "La calificación es obligatoria")
    @Min(value = 1, message = "La calificación debe ser entre 1 y 5")
    @Max(value = 5, message = "La calificación debe ser entre 1 y 5")
    private Integer calificacion;

    private String comentario;
}