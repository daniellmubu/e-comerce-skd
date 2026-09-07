package com.skd.sublimacion_api.service.impl;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skd.sublimacion_api.entity.ItemCarrito;
import com.skd.sublimacion_api.entity.ItemPedido;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.entity.VarianteProducto;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.ItemPedidoRepository;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.repository.VarianteProductoRepository;
import com.skd.sublimacion_api.service.InventarioService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventarioServiceImpl implements InventarioService {

    private final ProductoRepository productoRepository;
    private final VarianteProductoRepository varianteProductoRepository;
    private final ItemPedidoRepository itemPedidoRepository;

    @Override
    public List<LineaInventario> lineasDeCarrito(List<ItemCarrito> items) {
        return items.stream()
                .map(i -> new LineaInventario(
                        i.getProducto() != null ? i.getProducto().getId() : null,
                        i.getVariante() != null ? i.getVariante().getId() : null,
                        i.getCantidad() == null ? 0 : i.getCantidad()))
                .toList();
    }

    @Override
    public List<LineaInventario> lineasDeItemPedido(List<ItemPedido> items) {
        return items.stream()
                .map(i -> new LineaInventario(
                        i.getProducto() != null ? i.getProducto().getId() : null,
                        i.getVariante() != null ? i.getVariante().getId() : null,
                        i.getCantidad() == null ? 0 : i.getCantidad()))
                .toList();
    }

    @Override
    @Transactional
    public void reservar(List<LineaInventario> lineas) {
        // Ordena ids para evitar deadlocks entre transacciones concurrentes.
        List<LineaInventario> ordenadas = lineas.stream()
                .sorted(Comparator
                        .comparing((LineaInventario l) -> l.varianteId() != null ? l.varianteId() : Long.MAX_VALUE)
                        .thenComparing(l -> l.productoId() != null ? l.productoId() : Long.MAX_VALUE))
                .toList();

        for (LineaInventario linea : ordenadas) {
            if (linea.cantidad() <= 0) {
                continue;
            }
            if (linea.varianteId() != null) {
                VarianteProducto variante = varianteProductoRepository
                        .findByIdForUpdate(linea.varianteId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Variante no encontrada (id=" + linea.varianteId() + ")"));
                int stockActual = variante.getStock() != null ? variante.getStock() : 0;
                if (stockActual < linea.cantidad()) {
                    throw new IllegalArgumentException(
                            "No hay suficiente stock para la variante " + variante.getTalla() + "/"
                                    + variante.getColor() + ". Stock disponible: " + stockActual
                                    + ", solicitas: " + linea.cantidad());
                }
                variante.setStock(stockActual - linea.cantidad());
                varianteProductoRepository.save(variante);
            } else if (linea.productoId() != null) {
                Producto producto = productoRepository
                        .findByIdForUpdate(linea.productoId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Producto no encontrado (id=" + linea.productoId() + ")"));
                int stockActual = producto.getStock() != null ? producto.getStock() : 0;
                if (stockActual < linea.cantidad()) {
                    throw new IllegalArgumentException(
                            "No hay suficiente stock para " + producto.getNombre()
                                    + ". Stock disponible: " + stockActual
                                    + ", solicitas: " + linea.cantidad());
                }
                producto.setStock(stockActual - linea.cantidad());
                productoRepository.save(producto);
            }
        }
    }

    @Override
    @Transactional
    public void reponer(List<LineaInventario> lineas) {
        for (LineaInventario linea : lineas) {
            if (linea.cantidad() <= 0) {
                continue;
            }
            if (linea.varianteId() != null) {
                VarianteProducto variante = varianteProductoRepository
                        .findByIdForUpdate(linea.varianteId())
                        .orElse(null);
                if (variante == null) {
                    log.warn("[Inventario] No se repone: variante {} no existe", linea.varianteId());
                    continue;
                }
                variante.setStock((variante.getStock() != null ? variante.getStock() : 0) + linea.cantidad());
                varianteProductoRepository.save(variante);
            } else if (linea.productoId() != null) {
                Producto producto = productoRepository
                        .findByIdForUpdate(linea.productoId())
                        .orElse(null);
                if (producto == null) {
                    log.warn("[Inventario] No se repone: producto {} no existe", linea.productoId());
                    continue;
                }
                producto.setStock((producto.getStock() != null ? producto.getStock() : 0) + linea.cantidad());
                productoRepository.save(producto);
            }
        }
    }

    @Override
    @Transactional
    public void reponerPedido(Long pedidoId) {
        List<ItemPedido> items = itemPedidoRepository.findByPedidoId(pedidoId);
        if (items == null || items.isEmpty()) {
            log.warn("[Inventario] Pedido {} sin ítems; nada que reponer", pedidoId);
            return;
        }
        reponer(lineasDeItemPedido(items));
    }

    @Override
    @Transactional
    public void reservarPedido(Long pedidoId) {
        List<ItemPedido> items = itemPedidoRepository.findByPedidoId(pedidoId);
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("El pedido no tiene ítems para reservar stock.");
        }
        reservar(lineasDeItemPedido(items));
    }

    @Override
    @Transactional
    public int reponerPedidos(List<Long> pedidoIds) {
        if (pedidoIds == null || pedidoIds.isEmpty()) {
            return 0;
        }
        // findById busca uno por uno; se itera para que el servicio reponga bajo
        // el mismo método transaccional e idempotente.
        int repuestos = 0;
        for (Long pedidoId : pedidoIds) {
            reponerPedido(pedidoId);
            repuestos++;
        }
        return repuestos;
    }
}
