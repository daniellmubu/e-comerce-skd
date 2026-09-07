package com.skd.sublimacion_api.dto.ventadirecta;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VentaDirectaResponse {

    private Long id;

    /** Id del cliente persistido (null en ventas antiguas sin cliente). */
    private Long clienteId;

    private String nombreCliente;

    private String telefono;

    private String metodoPago;

    /** pendiente (por cobrar) | cobrada | cancelada. */
    private String estado;

    private String nota;

    private BigDecimal total;

    private LocalDateTime creadoEn;

    private LocalDateTime pagadoEn;

    private LocalDateTime canceladoEn;

    private List<ItemVentaDirectaResponse> items;
}
