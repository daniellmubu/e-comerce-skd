package com.skd.sublimacion_api.dto.pedido;

import lombok.Data;

@Data
public class ItemPedidoRequest {

    private Long productoId;

    private Integer cantidad;

}