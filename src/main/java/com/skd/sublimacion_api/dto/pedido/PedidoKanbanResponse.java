package com.skd.sublimacion_api.dto.pedido;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

/**
 * Versión compacta de un pedido para el tablero kanban de producción.
 */
@Data
@Builder
public class PedidoKanbanResponse {

    private Long id;

    private Long usuarioId;

    private String usuario;

    private String estado;

    private BigDecimal total;

    private LocalDateTime creadoEn;

    private Integer cantidadItems;

    private Boolean tieneDiseno;

    private String guiaEnvio;
}
