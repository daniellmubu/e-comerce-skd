package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.dto.detallecarrito.ItemCarritoRequest;
import com.skd.sublimacion_api.dto.detallecarrito.ItemCarritoResponse;
import com.skd.sublimacion_api.entity.Carrito;
import com.skd.sublimacion_api.entity.item_carrito;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.CarritoRepository;
import com.skd.sublimacion_api.repository.ItemCarritoRepository;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.service.ItemCarritoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemCarritoServiceImpl implements ItemCarritoService {

    private final ItemCarritoRepository detalleCarritoRepository;
    private final CarritoRepository carritoRepository;
    private final ProductoRepository productoRepository;

    @Override
    public List<ItemCarritoResponse> listar() {

        return detalleCarritoRepository.findAll()
                .stream()
                .map(this::convertir)
                .toList();
    }

    @Override
    public ItemCarritoResponse obtenerPorId(Long id) {

        item_carrito detalle = detalleCarritoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Detalle del carrito no encontrado"));

        return convertir(detalle);
    }

    @Override
    public ItemCarritoResponse guardar(ItemCarritoRequest request) {

        Carrito carrito = carritoRepository.findById(request.getCarritoId())
                .orElseThrow(() -> new ResourceNotFoundException("Carrito no encontrado"));

        Producto producto = productoRepository.findById(request.getProductoId())
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));

        item_carrito detalle = item_carrito.builder()
                .carrito(carrito)
                .producto(producto)
                .cantidad(request.getCantidad())
                .precioUnitario(producto.getPrecio())
                .build();

        detalle = detalleCarritoRepository.save(detalle);

        return convertir(detalle);
    }

    @Override
    public void eliminar(Long id) {

        item_carrito detalle = detalleCarritoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Detalle del carrito no encontrado"));

        detalleCarritoRepository.delete(detalle);
    }

    @Override
    public List<ItemCarritoResponse> listarPorCarrito(Long carritoId) {

        return detalleCarritoRepository.findByCarritoId(carritoId)
                .stream()
                .map(this::convertir)
                .toList();
    }

    private ItemCarritoResponse convertir(item_carrito detalle) {

        BigDecimal subtotal = detalle.getPrecioUnitario()
                .multiply(BigDecimal.valueOf(detalle.getCantidad()));

        return ItemCarritoResponse.builder()
                .id(detalle.getId())
                .carritoId(detalle.getCarrito().getId())
                .productoId(detalle.getProducto().getId())
                .producto(detalle.getProducto().getNombre())
                .cantidad(detalle.getCantidad())
                .precioUnitario(detalle.getPrecioUnitario())
                .subtotal(subtotal)
                .build();
    }
}