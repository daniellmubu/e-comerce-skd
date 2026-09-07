package com.skd.sublimacion_api.service.impl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skd.sublimacion_api.dto.detallecarrito.ItemCarritoRequest;
import com.skd.sublimacion_api.dto.pedido.ItemPedidoRequest;
import com.skd.sublimacion_api.dto.pedido.ItemPedidoResponse;
import com.skd.sublimacion_api.dto.pedido.PedidoRequest;
import com.skd.sublimacion_api.dto.pedido.PedidoResponse;
import com.skd.sublimacion_api.entity.Carrito;
import com.skd.sublimacion_api.entity.Cupon;
import com.skd.sublimacion_api.entity.Direccion;
import com.skd.sublimacion_api.entity.Empaque;
import com.skd.sublimacion_api.entity.Factura;
import com.skd.sublimacion_api.entity.ItemPedido;
import com.skd.sublimacion_api.entity.Pedido;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.exeption.BadRequestException;
import com.skd.sublimacion_api.exeption.ForbiddenException;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.CarritoRepository;
import com.skd.sublimacion_api.repository.CuponRepository;
import com.skd.sublimacion_api.repository.DireccionRepository;
import com.skd.sublimacion_api.repository.EmpaqueRepository;
import com.skd.sublimacion_api.repository.FacturaRepository;
import com.skd.sublimacion_api.repository.ItemPedidoRepository;
import com.skd.sublimacion_api.repository.PedidoRepository;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.service.InventarioService;
import com.skd.sublimacion_api.service.ItemCarritoService;
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
    private final CarritoRepository carritoRepository;
    private final ItemCarritoService itemCarritoService;
    private final InventarioService inventarioService;

    @Override
    public PedidoResponse obtenerPorId(Long id, Long usuarioId) {

        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado"));

        validarPropietario(pedido.getUsuario().getId(), usuarioId);

        return convertir(pedido);
    }

    @Override
    public List<PedidoResponse> listarPorUsuario(Long usuarioId) {

        List<Pedido> pedidos = pedidoRepository.findByUsuarioId(usuarioId);
        List<Long> ids = pedidos.stream().map(Pedido::getId).toList();

        Map<Long, List<ItemPedido>> itemsPorPedido = itemPedidoRepository
                .findByPedidoIdIn(ids).stream()
                .collect(Collectors.groupingBy(i -> i.getPedido().getId()));

        Map<Long, Factura> facturaPorPedido = facturaRepository
                .findByPedidoIdIn(ids).stream()
                .collect(Collectors.toMap(f -> f.getPedido().getId(), f -> f));

        return pedidos.stream()
                .map(p -> convertir(p, itemsPorPedido.getOrDefault(p.getId(), List.of()), facturaPorPedido.get(p.getId())))
                .toList();
    }

    @Override
    @Transactional
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

        // La validación de disponibilidad y el descuento de stock se delegan en el
        // servicio único de inventario (bloqueo pesimista + descuento atómico).
        List<Producto> productos = request.getItems().stream()
                .map(item -> productoRepository.findById(item.getProductoId())
                        .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + item.getProductoId())))
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

        List<InventarioService.LineaInventario> lineas = request.getItems().stream()
                .map(item -> new InventarioService.LineaInventario(
                        item.getProductoId(), null, item.getCantidad()))
                .toList();
        inventarioService.reservar(lineas);

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

    private PedidoResponse convertir(Pedido pedido) {

        List<ItemPedido> items = itemPedidoRepository.findByPedidoId(pedido.getId());
        Factura factura = facturaRepository.findByPedidoId(pedido.getId()).orElse(null);
        return convertir(pedido, items, factura);
    }

    private PedidoResponse convertir(Pedido pedido, List<ItemPedido> items, Factura factura) {

        List<ItemPedidoResponse> respuestas = items.stream()
                .map(this::convertirItem)
                .toList();

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
                .items(respuestas)
                .empaque(pedido.getEmpaque() != null ? pedido.getEmpaque().getTipo() : null)
                .facturaId(factura != null ? factura.getId() : null)
                .numeroFactura(factura != null ? factura.getNumeroFactura() : null)
                .destinatarioRegalo(pedido.getDestinatarioRegalo())
                .ocasionRegalo(pedido.getOcasionRegalo())
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
                .varianteId(item.getVariante() != null ? item.getVariante().getId() : null)
                .talla(item.getVariante() != null ? item.getVariante().getTalla() : null)
                .color(item.getVariante() != null ? item.getVariante().getColor() : null)
                .build();
    }

    @Override
    public Map<String, Object> reordenar(Long pedidoId, Long usuarioId) {

        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado"));

        if (!pedido.getUsuario().getId().equals(usuarioId)) {
            throw new ForbiddenException("No puedes reordenar un pedido que no te pertenece.");
        }

        Carrito carrito = carritoRepository.findByUsuarioId(usuarioId)
                .orElseGet(() -> carritoRepository.save(
                        Carrito.builder().usuario(pedido.getUsuario()).build()));

        int agregados = 0;
        int omitidos = 0;
        String motivo = null;

        for (ItemPedido item : itemPedidoRepository.findByPedidoId(pedidoId)) {
            ItemCarritoRequest request = new ItemCarritoRequest();
            request.setCarritoId(carrito.getId());
            request.setProductoId(item.getProducto().getId());
            request.setCantidad(item.getCantidad());
            request.setDisenoId(item.getDiseno() != null ? item.getDiseno().getId() : null);
            request.setVarianteId(item.getVariante() != null ? item.getVariante().getId() : null);

            try {
                itemCarritoService.guardar(request, usuarioId);
                agregados++;
            } catch (BadRequestException e) {
                omitidos++;
                motivo = e.getMessage();
            } catch (RuntimeException e) {
                omitidos++;
            }
        }

        return Map.of(
                "agregados", agregados,
                "omitidos", omitidos,
                "motivo", motivo == null ? "" : motivo,
                "carritoId", carrito.getId());
    }

}