package com.skd.sublimacion_api.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skd.sublimacion_api.dto.ventadirecta.ClienteVentaDirectaResponse;
import com.skd.sublimacion_api.dto.ventadirecta.ItemVentaDirectaRequest;
import com.skd.sublimacion_api.dto.ventadirecta.ItemVentaDirectaResponse;
import com.skd.sublimacion_api.dto.ventadirecta.VentaDirectaRequest;
import com.skd.sublimacion_api.dto.ventadirecta.VentaDirectaResponse;
import com.skd.sublimacion_api.entity.ClienteVentaDirecta;
import com.skd.sublimacion_api.entity.ItemVentaDirecta;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.entity.VarianteProducto;
import com.skd.sublimacion_api.entity.VentaDirecta;
import com.skd.sublimacion_api.exeption.BadRequestException;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.ClienteVentaDirectaRepository;
import com.skd.sublimacion_api.repository.ItemVentaDirectaRepository;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.repository.VarianteProductoRepository;
import com.skd.sublimacion_api.repository.VentaDirectaRepository;
import com.skd.sublimacion_api.service.InventarioService;
import com.skd.sublimacion_api.service.InventarioService.LineaInventario;
import com.skd.sublimacion_api.service.VentaDirectaService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class VentaDirectaServiceImpl implements VentaDirectaService {

    private static final Set<String> METODOS_PAGO_VALIDOS =
            Set.of("efectivo", "nequi", "transferencia", "tarjeta", "otro");

    private final VentaDirectaRepository ventaRepository;
    private final ItemVentaDirectaRepository itemVentaRepository;
    private final ClienteVentaDirectaRepository clienteRepository;
    private final ProductoRepository productoRepository;
    private final VarianteProductoRepository varianteRepository;
    private final InventarioService inventarioService;

    @Override
    @Transactional(readOnly = true)
    public Page<VentaDirectaResponse> listar(String estado, String q, Pageable pageable) {
        String estadoNormal = (estado == null || estado.isBlank()) ? null : estado.trim().toLowerCase();
        String qNormal = (q == null) ? "" : q.trim();
        return ventaRepository.buscar(estadoNormal, qNormal, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public VentaDirectaResponse obtenerPorId(Long id) {
        return toResponse(obtenerVenta(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClienteVentaDirectaResponse> listarClientes(String q) {
        String qNormal = (q == null) ? "" : q.trim();
        return clienteRepository
                .findTop20ByNombreContainingIgnoreCaseOrTelefonoContainingIgnoreCaseOrderByNombreAsc(
                        qNormal, qNormal)
                .stream()
                .map(this::aClienteResponse)
                .toList();
    }

    @Override
    @Transactional
    public VentaDirectaResponse crear(VentaDirectaRequest request) {
        String estado = request.getEstado() == null || request.getEstado().isBlank()
                ? VentaDirecta.ESTADO_PENDIENTE
                : request.getEstado().trim().toLowerCase();
        if (!VentaDirecta.ESTADO_PENDIENTE.equals(estado) && !VentaDirecta.ESTADO_COBRADA.equals(estado)) {
            throw new BadRequestException(
                    "Estado inicial inválido. Usa 'pendiente' (por cobrar) o 'cobrada'.");
        }

        String metodo = request.getMetodoPago().trim().toLowerCase();
        if (!METODOS_PAGO_VALIDOS.contains(metodo)) {
            throw new BadRequestException(
                    "Método de pago inválido. Usa: efectivo, nequi, transferencia, tarjeta u otro.");
        }

        List<LineaInventario> lineas = new ArrayList<>();
        List<Preparado> preparados = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (ItemVentaDirectaRequest itemReq : request.getItems()) {
            Producto producto = productoRepository.findById(itemReq.getProductoId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Producto no encontrado (id=" + itemReq.getProductoId() + ")"));

            boolean productoConVariantes = varianteRepository.existsByProductoId(producto.getId());
            VarianteProducto variante = null;
            if (itemReq.getVarianteId() != null) {
                variante = varianteRepository.findById(itemReq.getVarianteId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Variante no encontrada (id=" + itemReq.getVarianteId() + ")"));
                if (!variante.getProducto().getId().equals(producto.getId())) {
                    throw new BadRequestException(
                            "La variante elegida no pertenece al producto " + producto.getNombre());
                }
            } else if (productoConVariantes) {
                throw new BadRequestException(
                        "Debes elegir talla/color para: " + producto.getNombre());
            }

            int cantidad = itemReq.getCantidad() == null ? 1 : itemReq.getCantidad();
            BigDecimal precio = itemReq.getPrecioUnitario() != null
                    ? itemReq.getPrecioUnitario()
                    : (variante != null ? variante.getPrecio() : producto.getPrecio());
            if (precio == null || precio.compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException("Precio inválido para: "
                        + (variante != null ? producto.getNombre() + " (" + variante.getTalla()
                                + "/" + variante.getColor() + ")" : producto.getNombre()));
            }

            lineas.add(new LineaInventario(producto.getId(),
                    variante != null ? variante.getId() : null, cantidad));
            String detalle = variante != null
                    ? producto.getNombre() + " — " + variante.getTalla() + " / " + variante.getColor()
                    : producto.getNombre();
            preparados.add(new Preparado(producto, variante, cantidad, precio, detalle));
            total = total.add(precio.multiply(BigDecimal.valueOf(cantidad)));
        }

        // Descuenta el inventario (misma transacción: si algo falla se revierte).
        try {
            inventarioService.reservar(lineas);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(ex.getMessage());
        }

        // Guarda o reutiliza el cliente para autocompletar sus datos en futuras ventas.
        ClienteVentaDirecta cliente = resolverOCrearCliente(
                request.getClienteId(),
                request.getNombreCliente().trim(),
                request.getTelefono() != null ? request.getTelefono().trim() : null);

        VentaDirecta venta = VentaDirecta.builder()
                .cliente(cliente)
                .nombreCliente(cliente.getNombre())
                .telefono(cliente.getTelefono())
                .metodoPago(metodo)
                .estado(estado)
                .nota(request.getNota() != null ? request.getNota().trim() : null)
                .total(total)
                .pagadoEn(VentaDirecta.ESTADO_COBRADA.equals(estado) ? LocalDateTime.now() : null)
                .build();
        VentaDirecta ventaGuardada = ventaRepository.save(venta);

        List<ItemVentaDirecta> entities = preparados.stream()
                .map(p -> ItemVentaDirecta.builder()
                        .venta(ventaGuardada)
                        .producto(p.producto())
                        .variante(p.variante())
                        .cantidad(p.cantidad())
                        .precioUnitario(p.precio())
                        .detalle(p.detalle())
                        .build())
                .toList();
        itemVentaRepository.saveAll(entities);

        return toResponse(ventaGuardada);
    }

    @Override
    @Transactional
    public VentaDirectaResponse cambiarCobro(Long id, Boolean cobrado) {
        VentaDirecta venta = obtenerVenta(id);
        if (VentaDirecta.ESTADO_CANCELADA.equals(venta.getEstado())) {
            throw new BadRequestException("No puedes cambiar el cobro de una venta cancelada.");
        }
        if (Boolean.TRUE.equals(cobrado)) {
            venta.setEstado(VentaDirecta.ESTADO_COBRADA);
            venta.setPagadoEn(LocalDateTime.now());
        } else {
            venta.setEstado(VentaDirecta.ESTADO_PENDIENTE);
            venta.setPagadoEn(null);
        }
        return toResponse(ventaRepository.save(venta));
    }

    @Override
    @Transactional
    public VentaDirectaResponse cancelar(Long id) {
        VentaDirecta venta = obtenerVenta(id);
        if (VentaDirecta.ESTADO_CANCELADA.equals(venta.getEstado())) {
            throw new BadRequestException("La venta ya está cancelada.");
        }
        // Devuelve el stock reservado por la venta.
        inventarioService.reponer(lineasDeVenta(id));
        venta.setEstado(VentaDirecta.ESTADO_CANCELADA);
        venta.setCanceladoEn(LocalDateTime.now());
        return toResponse(ventaRepository.save(venta));
    }

    @Override
    @Transactional
    public VentaDirectaResponse reactivar(Long id) {
        VentaDirecta venta = obtenerVenta(id);
        if (!VentaDirecta.ESTADO_CANCELADA.equals(venta.getEstado())) {
            throw new BadRequestException("Solo se puede reactivar una venta cancelada.");
        }
        List<LineaInventario> lineas = lineasDeVenta(id);
        try {
            inventarioService.reservar(lineas);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("No se pudo reactivar: " + ex.getMessage());
        }
        venta.setEstado(VentaDirecta.ESTADO_PENDIENTE);
        venta.setCanceladoEn(null);
        venta.setPagadoEn(null);
        return toResponse(ventaRepository.save(venta));
    }

    // --------- helpers ---------

    private VentaDirecta obtenerVenta(Long id) {
        return ventaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Venta directa no encontrada con id: " + id));
    }

    private List<LineaInventario> lineasDeVenta(Long ventaId) {
        List<ItemVentaDirecta> items = itemVentaRepository.findByVentaId(ventaId);
        return items.stream()
                .map(i -> new LineaInventario(
                        i.getProducto() != null ? i.getProducto().getId() : null,
                        i.getVariante() != null ? i.getVariante().getId() : null,
                        i.getCantidad() == null ? 0 : i.getCantidad()))
                .toList();
    }

    private VentaDirectaResponse toResponse(VentaDirecta venta) {
        List<ItemVentaDirecta> items = itemVentaRepository.findByVentaId(venta.getId());
        List<ItemVentaDirectaResponse> itemsResp = items.stream()
                .map(i -> {
                    VarianteProducto v = i.getVariante();
                    Producto p = i.getProducto();
                    BigDecimal subtotal = i.getPrecioUnitario()
                            .multiply(BigDecimal.valueOf(i.getCantidad()));
                    return ItemVentaDirectaResponse.builder()
                            .id(i.getId())
                            .productoId(p != null ? p.getId() : null)
                            .productoNombre(p != null ? p.getNombre() : "—")
                            .varianteId(v != null ? v.getId() : null)
                            .talla(v != null ? v.getTalla() : null)
                            .color(v != null ? v.getColor() : null)
                            .detalle(i.getDetalle())
                            .cantidad(i.getCantidad())
                            .precioUnitario(i.getPrecioUnitario())
                            .subtotal(subtotal)
                            .build();
                })
                .toList();

        return VentaDirectaResponse.builder()
                .id(venta.getId())
                .clienteId(venta.getCliente() != null ? venta.getCliente().getId() : null)
                .nombreCliente(venta.getNombreCliente())
                .telefono(venta.getTelefono())
                .metodoPago(venta.getMetodoPago())
                .estado(venta.getEstado())
                .nota(venta.getNota())
                .total(venta.getTotal())
                .creadoEn(venta.getCreadoEn())
                .pagadoEn(venta.getPagadoEn())
                .canceladoEn(venta.getCanceladoEn())
                .items(itemsResp)
                .build();
    }

    /**
     * Resuelve el cliente: usa el {@code clienteId} si llega (autocompletado), sino
     * busca por nombre exacto (ignora mayúsculas) y, si no existe, lo crea. Si llega
     * un teléfono se lo actualiza al cliente.
     */
    private ClienteVentaDirecta resolverOCrearCliente(Long clienteId, String nombre, String telefono) {
        ClienteVentaDirecta cliente;
        if (clienteId != null) {
            cliente = clienteRepository.findById(clienteId)
                    .orElseThrow(() -> new BadRequestException("El cliente indicado no existe."));
        } else {
            cliente = clienteRepository.findFirstByNombreIgnoreCase(nombre).orElse(null);
            if (cliente == null) {
                cliente = clienteRepository.save(ClienteVentaDirecta.builder()
                        .nombre(nombre)
                        .telefono(telefono)
                        .build());
                return cliente;
            }
        }
        if (telefono != null && !telefono.isBlank() && !telefono.equals(cliente.getTelefono())) {
            cliente.setTelefono(telefono);
            clienteRepository.save(cliente);
        }
        return cliente;
    }

    private ClienteVentaDirectaResponse aClienteResponse(ClienteVentaDirecta cliente) {
        return ClienteVentaDirectaResponse.builder()
                .id(cliente.getId())
                .nombre(cliente.getNombre())
                .telefono(cliente.getTelefono())
                .build();
    }

    /** Registro intermedio usado durante la creación de una venta. */
    private record Preparado(Producto producto, VarianteProducto variante,
                             Integer cantidad, BigDecimal precio, String detalle) {
    }
}
