package com.skd.sublimacion_api.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skd.sublimacion_api.dto.checkout.CheckoutRequest;
import com.skd.sublimacion_api.dto.checkout.CheckoutResponse;
import com.skd.sublimacion_api.entity.Factura;
import com.skd.sublimacion_api.entity.Carrito;
import com.skd.sublimacion_api.entity.Cupon;
import com.skd.sublimacion_api.entity.Direccion;
import com.skd.sublimacion_api.entity.Empaque;
import com.skd.sublimacion_api.entity.Pago;
import com.skd.sublimacion_api.entity.Pedido;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.entity.item_carrito;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.CarritoRepository;
import com.skd.sublimacion_api.repository.CuponRepository;
import com.skd.sublimacion_api.repository.DireccionRepository;
import com.skd.sublimacion_api.repository.EmpaqueRepository;
import com.skd.sublimacion_api.repository.FacturaRepository;
import com.skd.sublimacion_api.repository.ItemCarritoRepository;
import com.skd.sublimacion_api.repository.PagoRepository;
import com.skd.sublimacion_api.repository.PedidoRepository;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.service.CheckoutService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CheckoutServiceImpl implements CheckoutService {

    private final UsuarioRepository usuarioRepository;
    private final CarritoRepository carritoRepository;
    private final ItemCarritoRepository itemCarritoRepository;
    private final PedidoRepository pedidoRepository;
    private final PagoRepository pagoRepository;
    private final FacturaRepository facturaRepository;
    private final DireccionRepository direccionRepository;
    private final EmpaqueRepository empaqueRepository;
    private final CuponRepository cuponRepository;
    private final ProductoRepository productoRepository;

    @Override
    @Transactional
    public CheckoutResponse procesarCheckout(CheckoutRequest request) {

        Usuario usuario = obtenerUsuario(request.getUsuarioId());

        Direccion direccion = obtenerDireccion(request.getDireccionId());

        Empaque empaque = obtenerEmpaque(request.getEmpaqueId());

        Cupon cupon = null;

        if (request.getCuponId() != null) {
            cupon = obtenerCupon(request.getCuponId());
        }

        Carrito carrito = obtenerCarrito(usuario);

        List<item_carrito> items = obtenerItems(carrito);
        validarStock(items);

        BigDecimal subtotal = calcularSubtotal(items);

        BigDecimal descuento = calcularDescuento(subtotal, cupon);

        BigDecimal costoEmpaque = calcularCostoEmpaque(empaque);

        BigDecimal costoEnvio = calcularCostoEnvio();

        BigDecimal total = subtotal
            .subtract(descuento)
            .add(costoEmpaque)
            .add(costoEnvio);
        Pedido pedido = crearPedido(
            usuario,
            direccion,
            empaque,
            cupon,
            subtotal,
            descuento,
            costoEnvio,
            total,
            request
        );
        Pago pago = crearPago(
        pedido,
        request.getMetodoPago(),
        total
        );
        Factura factura = crearFactura(pedido);
        actualizarStock(items);

        vaciarCarrito(items);

        return CheckoutResponse.builder()
            .pedidoId(pedido.getId())
            .pagoId(pago.getId())
            .facturaId(factura.getId())
            .numeroFactura(factura.getNumeroFactura())
            .subtotal(subtotal)
            .descuento(descuento)
            .costoEnvio(costoEnvio)
            .total(total)
            .estado(pedido.getEstado())
            .mensaje("Checkout realizado correctamente")
            .build();
    }

    private Usuario obtenerUsuario(Long usuarioId) {

        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Usuario no encontrado"));
    }

    private Direccion obtenerDireccion(Long direccionId) {

        return direccionRepository.findById(direccionId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Dirección no encontrada"));
    }

    private Empaque obtenerEmpaque(Long empaqueId) {

        return empaqueRepository.findById(empaqueId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Empaque no encontrado"));
    }

    private Cupon obtenerCupon(Long cuponId) {

        return cuponRepository.findById(cuponId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Cupón no encontrado"));
    }

    private Carrito obtenerCarrito(Usuario usuario) {

        return carritoRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("El usuario no tiene un carrito"));
    }

    private List<item_carrito> obtenerItems(Carrito carrito) {

        List<item_carrito> items = itemCarritoRepository.findByCarritoId(carrito.getId());

        if (items.isEmpty()) {
            throw new ResourceNotFoundException("El carrito está vacío");
        }

        return items;
    }
    private BigDecimal calcularSubtotal(List<item_carrito> items) {

    BigDecimal subtotal = BigDecimal.ZERO;

    for (item_carrito item : items) {

        BigDecimal totalItem = item.getPrecioUnitario()
                .multiply(BigDecimal.valueOf(item.getCantidad()));

        subtotal = subtotal.add(totalItem);
    }

    return subtotal;
    }
    private void validarStock(List<item_carrito> items) {
        for (item_carrito item : items) {
            if (item.getCantidad() > item.getProducto().getStock()) {
                throw new IllegalArgumentException(
                    "No hay suficiente stock para "
                            + item.getProducto().getNombre()
                );
            }
        }
    }
    
    private BigDecimal calcularDescuento(BigDecimal subtotal, Cupon cupon) {

    if (cupon == null) {
        return BigDecimal.ZERO;
    }

    BigDecimal porcentaje = cupon.getDescuentoPorcentaje()
            .divide(BigDecimal.valueOf(100));

    return subtotal.multiply(porcentaje);
    }
    private BigDecimal calcularCostoEmpaque(Empaque empaque) {
        if (empaque == null) {
            return BigDecimal.ZERO;
    }

        return empaque.getCostoAdicional();
    }
    private BigDecimal calcularCostoEnvio() {
        return BigDecimal.valueOf(12000);
    }
    private Pedido crearPedido(
        Usuario usuario,
        Direccion direccion,
        Empaque empaque,
        Cupon cupon,
        BigDecimal subtotal,
        BigDecimal descuento,
        BigDecimal costoEnvio,
        BigDecimal total,
        CheckoutRequest request
) {

    Pedido pedido = Pedido.builder()
            .usuario(usuario)
            .direccion(direccion)
            .empaque(empaque)
            .cupon(cupon)
            .estado("recibido")
            .subtotal(subtotal)
            .descuento(descuento)
            .costoEnvio(costoEnvio)
            .total(total)
            .fechaEntregaDeseada(request.getFechaEntregaDeseada())
            .build();

    return pedidoRepository.save(pedido);

}
    private Pago crearPago(
        Pedido pedido,
        String metodoPago,
        BigDecimal total
) {

    Pago pago = Pago.builder()
            .pedido(pedido)
            .metodo(metodoPago)
            .estado("pendiente")
            .monto(total)
            .procesadoEn(LocalDateTime.now())
            .build();

    return pagoRepository.save(pago);
}
    private Factura crearFactura(Pedido pedido) {

        String numeroFactura =
            "FAC-" +
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) +
            "-" +
            String.format("%06d", pedido.getId());

        Factura factura = Factura.builder()
            .pedido(pedido)
            .numeroFactura(numeroFactura)
            .emitidaEn(LocalDateTime.now())
            .build();

        return facturaRepository.save(factura);     
    }
    private void actualizarStock(List<item_carrito> items) {

        for (item_carrito item : items) {

            item.getProducto().setStock(
                item.getProducto().getStock() - item.getCantidad()
            );

            productoRepository.save(item.getProducto());

        }

    }
    private void vaciarCarrito(List<item_carrito> items) {

        itemCarritoRepository.deleteAll(items);

    }

}