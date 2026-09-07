package com.skd.sublimacion_api.dto.pedido;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PedidoRequest {

    @NotNull(message = "La dirección es obligatoria")
    private Long direccionId;

    @NotNull(message = "El empaque es obligatorio")
    private Long empaqueId;

    private Long cuponId;

    // Estos montos se recalculan en el servidor; se mantienen solo por compatibilidad
    // y se ignoran si vienen manipulados desde el cliente.
    private BigDecimal subtotal;

    private BigDecimal costoEnvio;

    private BigDecimal descuento;

    private BigDecimal total;

    @Future(message = "La fecha de entrega no puede ser anterior a hoy")
    private LocalDate fechaEntregaDeseada;

    @NotEmpty(message = "Debe incluir al menos un producto")
    private List<ItemPedidoRequest> items;

}