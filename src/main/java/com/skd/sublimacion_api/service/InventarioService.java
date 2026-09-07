package com.skd.sublimacion_api.service;

import java.util.List;

import com.skd.sublimacion_api.entity.ItemCarrito;
import com.skd.sublimacion_api.entity.ItemPedido;

/**
 * Servicio único de inventario.
 *
 * <p>Centraliza el descuento (reserva) y la reposición (liberación) del stock.
 * Una unidad vendible es siempre UNA variante (talla/color) o, si el producto
 * no tiene variantes, el propio producto. Para productos con variantes la única
 * fuente de verdad es la suma del stock de sus variantes.</p>
 */
public interface InventarioService {

    /**
     * Línea de inventario: qué se vende (variante o producto base) y cuántas unidades.
     *
     * @param productoId id del producto (siempre presente)
     * @param varianteId id de la variante (null si el producto no usa variantes)
     * @param cantidad   unidades
     */
    record LineaInventario(Long productoId, Long varianteId, int cantidad) {
    }

    /** Convierte los ítems del carrito en líneas de inventario. */
    List<LineaInventario> lineasDeCarrito(List<ItemCarrito> items);

    /** Convierte los ítems de un pedido ya guardado en líneas de inventario. */
    List<LineaInventario> lineasDeItemPedido(List<ItemPedido> items);

    /**
     * Descuenta el stock validando disponibilidad con bloqueo pesimista (evita
     * vender de más en compras simultáneas del último ítem).
     *
     * @throws IllegalArgumentException si no hay stock suficiente para alguna línea
     */
    void reservar(List<LineaInventario> lineas);

    /** Devuelve el stock previamente reservado (por ejemplo al liberar una reserva no pagada). */
    void reponer(List<LineaInventario> lineas);

    /** Repone el stock reservado por un pedido ya persistido. */
    void reponerPedido(Long pedidoId);

    /**
     * Reserva (descuenta) de nuevo el stock de un pedido ya persistido. Se usa cuando
     * se reanuda un pago cuya reserva ya se liberó (pago rechazado o expirado).
     *
     * @throws IllegalArgumentException si no hay stock suficiente
     */
    void reservarPedido(Long pedidoId);

    /** Repone el stock reservado por varios pedidos persistidos. Devuelve cuántos se repusieron. */
    int reponerPedidos(List<Long> pedidoIds);
}
