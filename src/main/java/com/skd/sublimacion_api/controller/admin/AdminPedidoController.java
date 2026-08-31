package com.skd.sublimacion_api.controller.admin;

import java.util.List;
import java.util.Map;

import com.skd.sublimacion_api.dto.pedido.CambiarEstadoPedidoRequest;
import com.skd.sublimacion_api.dto.pedido.PedidoKanbanResponse;
import com.skd.sublimacion_api.dto.pedido.PedidoResponse;
import com.skd.sublimacion_api.service.admin.AdminPedidoService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/pedidos")
@RequiredArgsConstructor
@Tag(
        name = "Administración - Pedidos",
        description = "Endpoints para la gestión de pedidos del panel administrativo."
)
public class AdminPedidoController {

    private final AdminPedidoService adminPedidoService;

    @Operation(
        summary = "Listar pedidos",
        description = "Obtiene un listado paginado de pedidos con filtros opcionales por estado y usuario."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado obtenido correctamente")
    })
    @GetMapping
    public Page<PedidoResponse> listar(

            @Parameter(description = "Estado del pedido (recibido, disenando, enviado, entregado, cancelado)")
            @RequestParam(required = false) String estado,

            @Parameter(description = "ID del usuario")
            @RequestParam(required = false) Long usuarioId,

            @PageableDefault(size = 10, sort = "id")
            Pageable pageable) {

        return adminPedidoService.listar(estado, usuarioId, pageable);
    }

    @Operation(
        summary = "Tablero kanban de producción",
        description = "Obtiene los pedidos en producción agrupados por estado " +
                "(recibido, disenando, imprimiendo, empacando, enviado)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tablero obtenido correctamente")
    })
    @GetMapping("/kanban")
    public Map<String, List<PedidoKanbanResponse>> kanban() {
        return adminPedidoService.kanban();
    }

    @Operation(
        summary = "Obtener pedido por ID",
        description = "Obtiene el detalle de un pedido con sus productos y diseños."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Pedido encontrado"),
            @ApiResponse(responseCode = "404", description = "Pedido no encontrado")
    })
    @GetMapping("/{id}")
    public PedidoResponse obtenerPorId(@PathVariable Long id) {
        return adminPedidoService.obtenerPorId(id);
    }

    @Operation(
        summary = "Cambiar estado de pedido",
        description = "Actualiza el estado de un pedido (recibido, disenando, enviado, entregado, cancelado)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estado actualizado"),
            @ApiResponse(responseCode = "400", description = "Estado inválido"),
            @ApiResponse(responseCode = "404", description = "Pedido no encontrado")
    })
    @PatchMapping("/{id}/estado")
    public PedidoResponse cambiarEstado(
            @PathVariable Long id,
            @Valid @RequestBody CambiarEstadoPedidoRequest request) {

        return adminPedidoService.cambiarEstado(id, request.getEstado());
    }

    @PatchMapping("/{id}/aprobar-pago")
    public PedidoResponse aprobarPago(@PathVariable Long id) {

        return adminPedidoService.aprobarPago(id);
    }
}
