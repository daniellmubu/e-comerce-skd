package com.skd.sublimacion_api.service.impl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.skd.sublimacion_api.dto.pedido.ItemPedidoRequest;
import com.skd.sublimacion_api.dto.pedido.ItemPedidoResponse;
import com.skd.sublimacion_api.dto.pedido.PedidoRequest;
import com.skd.sublimacion_api.dto.pedido.PedidoResponse;
import com.skd.sublimacion_api.entity.Cupon;
import com.skd.sublimacion_api.entity.Direccion;
import com.skd.sublimacion_api.entity.Empaque;
import com.skd.sublimacion_api.entity.Factura;
import com.skd.sublimacion_api.entity.ItemPedido;
import com.skd.sublimacion_api.entity.Pedido;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.exeption.ForbiddenException;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.CuponRepository;
import com.skd.sublimacion_api.repository.DireccionRepository;
import com.skd.sublimacion_api.repository.EmpaqueRepository;
import com.skd.sublimacion_api.repository.FacturaRepository;
import com.skd.sublimacion_api.repository.ItemPedidoRepository;
import com.skd.sublimacion_api.repository.PedidoRepository;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.service.PedidoService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PedidoServiceImpl implements PedidoService {

    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ItemPedidoRepository itemPedidoRepository;
    private final DireccionRepository direccionRepository;
    private final EmpaqueRepository empaqueRepository;
    private final CuponRepository cuponRepository;
    private final ProductoRepository productoRepository;
    private final FacturaRepository facturaRepository;

    @Override
    public PedidoResponse obtenerPorId(Long id, Long usuarioId) {

        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado"));

        validarPropietario(pedido.getUsuario().getId(), usuarioId);

        return convertir(pedido);
    }

    @Override
    public List<PedidoResponse> listarPorUsuario(Long usuarioId) {

        return pedidoRepository.findByUsuarioId(usuarioId)
                .stream()
                .map(this::convertir)
                .toList();
    }

    @Override
    public PedidoResponse guardar(PedidoRequest request, Long usuarioId) {

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Direccion direccion = direccionRepository.findById(request.getDireccionId())
                .orElseThrow(() -> new ResourceNotFoundException("Dirección no encontrada"));

        Empaque empaque = empaqueRepository.findById(request.getEmpaqueId())
                .orElseThrow(() -> new ResourceNotFoundException("Empaque no encontrado"));

        Cupon cupon = null;
        if (request.getCuponId() != null) {
            cupon = cuponRepository.findById(request.getCuponId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cupón no encontrado"));
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("El pedido debe tener al menos un producto");
        }

        List<Producto> productos = request.getItems().stream()
                .map(item -> {
                    Producto producto = productoRepository.findById(item.getProductoId())
                            .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + item.getProductoId()));

                    if (producto.getStock() < item.getCantidad()) {
                        throw new IllegalArgumentException("Stock insuficiente para: " + producto.getNombre());
                    }
                    return producto;
                })
                .toList();

        BigDecimal subtotal = BigDecimal.ZERO;
        for (int i = 0; i < request.getItems().size(); i++) {
            ItemPedidoRequest itemRequest = request.getItems().get(i);
            Producto producto = productos.get(i);
            subtotal = subtotal.add(producto.getPrecio().multiply(BigDecimal.valueOf(itemRequest.getCantidad())));
        }

        BigDecimal descuento = BigDecimal.ZERO;
        if (cupon != null) {
            descuento = subtotal.multiply(cupon.getDescuentoPorcentaje())
                    .divide(BigDecimal.valueOf(100));
        }

        BigDecimal costoEnvio = BigDecimal.valueOf(12000);
        BigDecimal costoEmpaque = empaque.getCostoAdicional() != null ? empaque.getCostoAdicional() : BigDecimal.ZERO;

        BigDecimal total = subtotal
                .subtract(descuento)
                .add(costoEnvio)
                .add(costoEmpaque);

        Pedido pedido = Pedido.builder()
                .usuario(usuario)
                .direccion(direccion)
                .empaque(empaque)
                .cupon(cupon)
                .estado("recibido")
                .subtotal(subtotal)
                .costoEnvio(costoEnvio)
                .descuento(descuento)
                .total(total)
                .fechaEntregaDeseada(request.getFechaEntregaDeseada())
                .build();

        pedido = pedidoRepository.save(pedido);

        List<ItemPedido> itemsPedido = new ArrayList<>();
        for (int i = 0; i < request.getItems().size(); i++) {
            ItemPedidoRequest itemRequest = request.getItems().get(i);
            Producto producto = productos.get(i);

            itemsPedido.add(ItemPedido.builder()
                    .pedido(pedido)
                    .producto(producto)
                    .cantidad(itemRequest.getCantidad())
                    .precioUnitario(producto.getPrecio())
                    .build());

            producto.setStock(producto.getStock() - itemRequest.getCantidad());
            productoRepository.save(producto);
        }
        itemPedidoRepository.saveAll(itemsPedido);

        return convertir(pedido);
    }

    @Override
    public void eliminar(Long id, Long usuarioId) {

        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado"));

        validarPropietario(pedido.getUsuario().getId(), usuarioId);

        pedidoRepository.delete(pedido);
    }

    private void validarPropietario(Long duenoId, Long usuarioId) {

        if (!duenoId.equals(usuarioId)) {
            throw new ForbiddenException("No tienes permiso para acceder a este pedido.");
        }
    }

    private PedidoResponse convertir(Pedido pedido){

    List<ItemPedidoResponse> items = itemPedidoRepository.findByPedidoId(pedido.getId())
            .stream()
            .map(this::convertirItem)
            .toList();

    Factura factura = facturaRepository.findByPedidoId(pedido.getId()).orElse(null);

    return PedidoResponse.builder()
            .id(pedido.getId())
            .usuarioId(pedido.getUsuario().getId())
            .usuario(pedido.getUsuario().getNombre())
            .creadoEn(pedido.getCreadoEn())
            .estado(pedido.getEstado())
            .subtotal(pedido.getSubtotal())
            .costoEnvio(pedido.getCostoEnvio())
            .descuento(pedido.getDescuento())
            .total(pedido.getTotal())
            .items(items)
            .facturaId(factura != null ? factura.getId() : null)
            .numeroFactura(factura != null ? factura.getNumeroFactura() : null)
            .build();
}

    private ItemPedidoResponse convertirItem(ItemPedido item) {

        return ItemPedidoResponse.builder()
                .id(item.getId())
                .productoId(item.getProducto().getId())
                .producto(item.getProducto().getNombre())
                .cantidad(item.getCantidad())
                .precioUnitario(item.getPrecioUnitario())
                .subtotal(item.getPrecioUnitario().multiply(BigDecimal.valueOf(item.getCantidad())))
                .disenoId(item.getDiseno() != null ? item.getDiseno().getId() : null)
                .imagenDisenoUrl(item.getDiseno() != null ? item.getDiseno().getImagenUrl() : null)
                .build();
    }

}