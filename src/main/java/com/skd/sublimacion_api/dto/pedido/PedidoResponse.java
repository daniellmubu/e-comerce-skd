package com.skd.sublimacion_api.dto.pedido;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PedidoResponse {

    private Long id;

    private Long usuarioId;

    private String usuario;

    private LocalDateTime creadoEn;

    private String estado;

    private BigDecimal subtotal;

    private BigDecimal costoEnvio;

    private BigDecimal descuento;

    private BigDecimal total;

    private List<ItemPedidoResponse> items;

    private Long facturaId;

    private String numeroFactura;

    private String empaque;

    private String metodoPago;

    private String estadoPago;

    private String destinatarioRegalo;

    private String ocasionRegalo;

}