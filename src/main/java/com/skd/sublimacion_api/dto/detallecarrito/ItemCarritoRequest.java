package com.skd.sublimacion_api.dto.detallecarrito;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ItemCarritoRequest {

    @NotNull
    private Long carritoId;

    @NotNull
    private Long productoId;

    @NotNull
    @Min(1)
    private Integer cantidad;
}