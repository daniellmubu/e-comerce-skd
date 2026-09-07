package com.skd.sublimacion_api.dto.ventadirecta;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Cuerpo para registrar una venta directa desde el panel admin. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VentaDirectaRequest {

    /**
     * Id de un cliente ya guardado (elegido del autocompletado). Opcional: si no
     * se envía, el backend busca por nombre y lo crea si no existe.
     */
    private Long clienteId;

    @NotBlank(message = "El nombre del cliente es obligatorio")
    private String nombreCliente;

    private String telefono;

    @NotBlank(message = "Indica el método de pago")
    private String metodoPago;

    /** 'pendiente' (por cobrar) | 'cobrada'. Si se omite queda 'pendiente'. */
    private String estado;

    private String nota;

    @NotEmpty(message = "Agrega al menos un producto a la venta")
    @Valid
    private List<ItemVentaDirectaRequest> items;
}
