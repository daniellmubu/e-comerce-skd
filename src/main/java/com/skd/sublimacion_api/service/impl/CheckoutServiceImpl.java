package com.skd.sublimacion_api.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skd.sublimacion_api.dto.checkout.CheckoutRequest;
import com.skd.sublimacion_api.dto.checkout.CheckoutResponse;
import com.skd.sublimacion_api.event.CheckoutCompletadoEvent;
import com.skd.sublimacion_api.entity.Factura;
import com.skd.sublimacion_api.entity.Carrito;
import com.skd.sublimacion_api.entity.Cupon;
import com.skd.sublimacion_api.entity.CuponUsuario;
import com.skd.sublimacion_api.entity.Direccion;
import com.skd.sublimacion_api.entity.Empaque;
import com.skd.sublimacion_api.entity.Pago;
import com.skd.sublimacion_api.entity.Pedido;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.entity.ItemPedido;
import com.skd.sublimacion_api.entity.ItemCarrito;
import com.skd.sublimacion_api.entity.Diseno;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.CarritoRepository;
import com.skd.sublimacion_api.repository.CuponRepository;
import com.skd.sublimacion_api.repository.CuponUsuarioRepository;
import com.skd.sublimacion_api.repository.DireccionRepository;
import com.skd.sublimacion_api.repository.DisenoRepository;
import com.skd.sublimacion_api.repository.EmpaqueRepository;
import com.skd.sublimacion_api.repository.FacturaRepository;
import com.skd.sublimacion_api.repository.ItemCarritoRepository;
import com.skd.sublimacion_api.repository.ItemPedidoRepository;
import com.skd.sublimacion_api.repository.PagoRepository;
import com.skd.sublimacion_api.repository.PedidoRepository;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.service.CheckoutService;
import com.skd.sublimacion_api.service.EnvioService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CheckoutServiceImpl implements CheckoutService {

    private final UsuarioRepository usuarioRepository;
    private final CarritoRepository carritoRepository;
    private final ItemCarritoRepository itemCarritoRepository;
    private final ItemPedidoRepository itemPedidoRepository;
    private final PedidoRepository pedidoRepository;
    private final PagoRepository pagoRepository;
    private final FacturaRepository facturaRepository;
    private final DireccionRepository direccionRepository;
    private final EmpaqueRepository empaqueRepository;
    private final CuponRepository cuponRepository;
    private final CuponUsuarioRepository cuponUsuarioRepository;
    private final ProductoRepository productoRepository;
    private final DisenoRepository disenoRepository;
    private final EnvioService envioService;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Override
    @Transactional
    public CheckoutResponse procesarCheckout(CheckoutRequest request, Long usuarioId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Direccion direccion = obtenerDireccion(request.getDireccionId());
        validarDireccionPertenece(direccion, usuarioId);

        Empaque empaque = obtenerEmpaque(request.getEmpaqueId());

        Cupon cupon = null;

        if (request.getCuponId() != null) {
            cupon = obtenerCupon(request.getCuponId());
            validarCupon(cupon, usuarioId);
            registrarUsoCupon(cupon, usuarioId);
        }

        Carrito carrito = obtenerCarrito(usuario);

        List<ItemCarrito> items = obtenerItems(carrito);
        validarStock(items);

        BigDecimal subtotal = calcularSubtotal(items);

        if (cupon != null) {
            validarMontoMinimo(cupon, subtotal);
        }

        BigDecimal descuento = calcularDescuento(subtotal, cupon);

        BigDecimal costoEmpaque = calcularCostoEmpaque(empaque);

        EnvioService.CostoEnvio costoEnvio =
                envioService.calcularParaCheckout(direccion);

        BigDecimal total = subtotal
            .subtract(descuento)
            .add(costoEmpaque)
            .add(costoEnvio.costo());
        Pedido pedido = crearPedido(
            usuario,
            direccion,
            empaque,
            cupon,
            subtotal,
            descuento,
            costoEnvio.costo(),
            costoEnvio.diasEstimados(),
            total,
            request
        );
        Pago pago = crearPago(
        pedido,
        request.getMetodoPago(),
        total
        );
        Factura factura = crearFactura(pedido);
        crearItemsPedido(pedido, items);
        actualizarStock(items);

        vaciarCarrito(items);

        applicationEventPublisher.publishEvent(new CheckoutCompletadoEvent(
                factura.getId(),
                usuario.getCorreo(),
                usuario.getNombre(),
                factura.getNumeroFactura()
        ));

        return CheckoutResponse.builder()
            .pedidoId(pedido.getId())
            .pagoId(pago.getId())
            .facturaId(factura.getId())
            .numeroFactura(factura.getNumeroFactura())
            .subtotal(subtotal)
            .descuento(descuento)
            .costoEnvio(costoEnvio.costo())
            .diasEstimadosEntrega(costoEnvio.diasEstimados())
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
                .orElseThrow(() -> new ResourceNotFoundException("Dirección no encontrada"));
    }

    private void validarDireccionPertenece(Direccion direccion, Long usuarioId) {
        if (!direccion.getUsuario().getId().equals(usuarioId)) {
            throw new com.skd.sublimacion_api.exeption.ForbiddenException("La dirección no te pertenece");
        }
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

    private void validarCupon(Cupon cupon, Long usuarioId) {

        if (!Boolean.TRUE.equals(cupon.getActivo())) {
            throw new IllegalArgumentException("El cupón no está activo");
        }

        LocalDate hoy = LocalDate.now();

        if (hoy.isBefore(cupon.getFechaInicio()) ||
                hoy.isAfter(cupon.getFechaFin())) {
            throw new IllegalArgumentException(
                    "El cupón expiró / no está vigente en esta fecha");
        }

        if (cupon.getUsosMaximos() != null &&
                cupon.getUsosActuales() != null &&
                cupon.getUsosActuales() >= cupon.getUsosMaximos()) {
            throw new IllegalArgumentException(
                    "El cupón alcanzó su máximo de usos");
        }

        if (Boolean.TRUE.equals(cupon.getEsUnicoPorUsuario()) &&
                cuponUsuarioRepository
                        .existsByCupon_IdAndUsuario_IdAndUsadoTrue(
                                cupon.getId(), usuarioId)) {
            throw new IllegalArgumentException(
                    "Este cupón ya fue utilizado por tu cuenta");
        }
    }

    private void validarMontoMinimo(Cupon cupon, BigDecimal subtotal) {
        if (cupon.getMontoMinimo() != null && subtotal.compareTo(cupon.getMontoMinimo()) < 0) {
            throw new IllegalArgumentException(
                    "Monto mínimo para este cupón: $" + cupon.getMontoMinimo().toPlainString() + ". Tu carrito: $" + subtotal.toPlainString());
        }
    }

    private void registrarUsoCupon(Cupon cupon, Long usuarioId) {

        cupon.setUsosActuales(
                (cupon.getUsosActuales() == null ? 0 : cupon.getUsosActuales()) + 1);
        cuponRepository.save(cupon);

        if (Boolean.TRUE.equals(cupon.getEsUnicoPorUsuario())) {

            cuponUsuarioRepository
                    .findByCupon_IdAndUsuario_Id(cupon.getId(), usuarioId)
                    .ifPresent(registro -> {
                        registro.setUsado(true);
                        registro.setFechaUso(LocalDateTime.now());
                        cuponUsuarioRepository.save(registro);
                    });
        }
    }

    private Carrito obtenerCarrito(Usuario usuario) {

        return carritoRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("El usuario no tiene un carrito"));
    }

    private List<ItemCarrito> obtenerItems(Carrito carrito) {

        List<ItemCarrito> items = itemCarritoRepository.findByCarritoId(carrito.getId());

        if (items.isEmpty()) {
            throw new ResourceNotFoundException("El carrito está vacío");
        }

        return items;
    }
    private BigDecimal calcularSubtotal(List<ItemCarrito> items) {

    BigDecimal subtotal = BigDecimal.ZERO;

    for (ItemCarrito item : items) {

        BigDecimal totalItem = item.getPrecioUnitario()
                .multiply(BigDecimal.valueOf(item.getCantidad()));

        subtotal = subtotal.add(totalItem);
    }

    return subtotal;
    }
    private void validarStock(List<ItemCarrito> items) {
        for (ItemCarrito item : items) {
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
    private Pedido crearPedido(
        Usuario usuario,
        Direccion direccion,
        Empaque empaque,
        Cupon cupon,
        BigDecimal subtotal,
        BigDecimal descuento,
        BigDecimal costoEnvio,
        Integer diasEstimadosEntrega,
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
            .diasEstimadosEntrega(diasEstimadosEntrega)
            .total(total)
            .fechaEntregaDeseada(request.getFechaEntregaDeseada())
            .destinatarioRegalo(request.getDestinatarioRegalo())
            .ocasionRegalo(request.getOcasionRegalo())
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
    private void crearItemsPedido(Pedido pedido, List<ItemCarrito> items) {

        List<ItemPedido> itemsPedido = items.stream()
                .map(item -> ItemPedido.builder()
                        .pedido(pedido)
                        .producto(item.getProducto())
                        .cantidad(item.getCantidad())
                        .precioUnitario(item.getPrecioUnitario())
                        .diseno(item.getDiseno())
                        .build())
                .toList();

        itemPedidoRepository.saveAll(itemsPedido);

        marcarDisenosComoUsados(items);
    }
    private void marcarDisenosComoUsados(List<ItemCarrito> items) {

        items.stream()
                .map(ItemCarrito::getDiseno)
                .filter(diseno -> diseno != null)
                .forEach(diseno -> {
                    diseno.setUsado(true);
                    diseno.setVecesUsado(
                            (diseno.getVecesUsado() == null ? 0 : diseno.getVecesUsado())
                                    + 1);
                    disenoRepository.save(diseno);
                });
    }
    private void actualizarStock(List<ItemCarrito> items) {

        for (ItemCarrito item : items) {

            item.getProducto().setStock(
                item.getProducto().getStock() - item.getCantidad()
            );

            productoRepository.save(item.getProducto());

        }

    }
    private void vaciarCarrito(List<ItemCarrito> items) {

        itemCarritoRepository.deleteAll(items);

    }

}