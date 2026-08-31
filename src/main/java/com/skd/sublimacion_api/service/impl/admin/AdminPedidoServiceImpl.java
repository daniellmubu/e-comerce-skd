package com.skd.sublimacion_api.service.impl.admin;

import com.skd.sublimacion_api.dto.pedido.ItemPedidoResponse;
import com.skd.sublimacion_api.dto.pedido.PedidoKanbanResponse;
import com.skd.sublimacion_api.dto.pedido.PedidoResponse;
import com.skd.sublimacion_api.entity.ItemPedido;
import com.skd.sublimacion_api.entity.Pedido;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.ItemPedidoRepository;
import com.skd.sublimacion_api.repository.PedidoRepository;
import com.skd.sublimacion_api.service.EmailService;
import com.skd.sublimacion_api.service.NotificacionService;
import com.skd.sublimacion_api.service.WebSocketService;
import com.skd.sublimacion_api.service.admin.AdminPedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminPedidoServiceImpl implements AdminPedidoService {

    // Estados coherentes con el flujo actual (recibido -> disenando) mas los
    // estados que el administrador debe poder gestionar en el panel.
    private static final List<String> ESTADOS_VALIDOS =
            List.of("recibido", "disenando", "imprimiendo", "empacando",
                    "enviado", "entregado", "cancelado");

    private final PedidoRepository pedidoRepository;
    private final ItemPedidoRepository itemPedidoRepository;
    private final WebSocketService webSocketService;
    private final NotificacionService notificacionService;
    private final EmailService emailService;

    @Override
    public Page<PedidoResponse> listar(String estado, Long usuarioId, Pageable pageable) {

        Page<Pedido> pagina;

        if (estado != null && !estado.isBlank() && usuarioId != null) {
            pagina = pedidoRepository.findByEstadoAndUsuarioId(estado.trim(), usuarioId, pageable);
        } else if (estado != null && !estado.isBlank()) {
            pagina = pedidoRepository.findByEstado(estado.trim(), pageable);
        } else if (usuarioId != null) {
            pagina = pedidoRepository.findByUsuarioId(usuarioId, pageable);
        } else {
            pagina = pedidoRepository.findAll(pageable);
        }

        return pagina.map(this::convertir);
    }

    @Override
    public PedidoResponse obtenerPorId(Long id) {
        return convertir(obtenerPedido(id));
    }

    @Override
    @Transactional
    public PedidoResponse cambiarEstado(Long id, String estado) {

        if (estado == null || estado.isBlank()) {
            throw new IllegalArgumentException("El estado es obligatorio");
        }

        String estadoNormalizado = estado.trim().toLowerCase();

        if (!ESTADOS_VALIDOS.contains(estadoNormalizado)) {
            throw new IllegalArgumentException(
                    "Estado inválido. Valores permitidos: " + ESTADOS_VALIDOS);
        }

        Pedido pedido = obtenerPedido(id);
        String estadoAnterior = pedido.getEstado();
        pedido.setEstado(estadoNormalizado);

        PedidoResponse response = convertir(pedidoRepository.save(pedido));

        if (!estadoAnterior.equals(pedido.getEstado())) {
            webSocketService.publicarEstadoPedido(pedido.getId(), pedido.getEstado());
            // Sincroniza el tablero de producción en tiempo real.
            webSocketService.publicarCambioKanban(pedido.getId(), pedido.getEstado());
            notificacionService.crear(
                    pedido.getUsuario().getId(),
                    "PEDIDO_" + pedido.getEstado().toUpperCase(),
                    "Tu pedido cambió de estado",
                    "Tu pedido #" + pedido.getId()
                            + " ahora está en estado: " + pedido.getEstado() + ".");
            emailService.enviarEstadoPedido(
                    pedido.getUsuario().getCorreo(),
                    pedido.getUsuario().getNombre(),
                    pedido.getId(),
                    pedido.getEstado());
        }

        return response;
    }

    @Override
    public Map<String, List<PedidoKanbanResponse>> kanban() {

        // Mismos estados que gestiona la vista "Pedidos" del panel.
        List<String> estadosProduccion = List.of(
                "recibido", "disenando", "enviado", "entregado", "cancelado");

        Map<String, List<PedidoKanbanResponse>> tablero = new LinkedHashMap<>();
        estadosProduccion.forEach(estado ->
                tablero.put(estado, new ArrayList<>()));

        List<Pedido> pedidos = pedidoRepository.findByEstadoIn(estadosProduccion);

        for (Pedido pedido : pedidos) {
            tablero.computeIfAbsent(pedido.getEstado(), k -> new ArrayList<>())
                    .add(convertirKanban(pedido));
        }

        // Cada columna ordenada de más reciente a más antiguo.
        Comparator<PedidoKanbanResponse> porFecha =
                Comparator.comparing(PedidoKanbanResponse::getCreadoEn,
                        Comparator.nullsLast(Comparator.reverseOrder()));
        tablero.values().forEach(lista -> lista.sort(porFecha));

        return tablero;
    }

    private Pedido obtenerPedido(Long id) {
        return pedidoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Pedido no encontrado con id: " + id));
    }

    private PedidoKanbanResponse convertirKanban(Pedido pedido) {

        List<ItemPedido> items = itemPedidoRepository.findByPedidoId(pedido.getId());

        int cantidadItems = items.stream()
                .mapToInt(ItemPedido::getCantidad)
                .sum();

        boolean tieneDiseno = items.stream()
                .anyMatch(item -> item.getDiseno() != null);

        return PedidoKanbanResponse.builder()
                .id(pedido.getId())
                .usuarioId(pedido.getUsuario().getId())
                .usuario(pedido.getUsuario().getNombre())
                .estado(pedido.getEstado())
                .total(pedido.getTotal())
                .creadoEn(pedido.getCreadoEn())
                .cantidadItems(cantidadItems)
                .tieneDiseno(tieneDiseno)
                .guiaEnvio(pedido.getGuiaEnvio())
                .build();
    }

    private PedidoResponse convertir(Pedido pedido) {

        List<ItemPedidoResponse> items = itemPedidoRepository
                .findByPedidoId(pedido.getId())
                .stream()
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
                .items(items)
                .build();
    }

    private ItemPedidoResponse convertirItem(ItemPedido item) {

        return ItemPedidoResponse.builder()
                .id(item.getId())
                .productoId(item.getProducto().getId())
                .producto(item.getProducto().getNombre())
                .cantidad(item.getCantidad())
                .precioUnitario(item.getPrecioUnitario())
                .subtotal(item.getPrecioUnitario()
                        .multiply(BigDecimal.valueOf(item.getCantidad())))
                .disenoId(item.getDiseno() != null ? item.getDiseno().getId() : null)
                .imagenDisenoUrl(item.getDiseno() != null ? item.getDiseno().getImagenUrl() : null)
                .build();
    }
}
