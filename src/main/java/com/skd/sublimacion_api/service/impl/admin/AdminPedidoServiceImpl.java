package com.skd.sublimacion_api.service.impl.admin;

import com.skd.sublimacion_api.dto.pedido.ItemPedidoResponse;
import com.skd.sublimacion_api.dto.pedido.PedidoResponse;
import com.skd.sublimacion_api.entity.ItemPedido;
import com.skd.sublimacion_api.entity.Pedido;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.ItemPedidoRepository;
import com.skd.sublimacion_api.repository.PedidoRepository;
import com.skd.sublimacion_api.service.admin.AdminPedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminPedidoServiceImpl implements AdminPedidoService {

    // Estados coherentes con el flujo actual (recibido -> disenando) mas los
    // estados que el administrador debe poder gestionar en el panel.
    private static final List<String> ESTADOS_VALIDOS =
            List.of("recibido", "disenando", "enviado", "entregado", "cancelado");

    private final PedidoRepository pedidoRepository;
    private final ItemPedidoRepository itemPedidoRepository;

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
        pedido.setEstado(estadoNormalizado);

        return convertir(pedidoRepository.save(pedido));
    }

    private Pedido obtenerPedido(Long id) {
        return pedidoRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Pedido no encontrado con id: " + id));
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
