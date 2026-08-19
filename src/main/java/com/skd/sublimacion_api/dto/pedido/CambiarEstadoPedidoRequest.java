package com.skd.sublimacion_api.dto.pedido;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CambiarEstadoPedidoRequest {

    @NotBlank(message = "El estado es obligatorio")
    private String estado;
}
