package com.skd.sublimacion_api.controller.admin;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.skd.sublimacion_api.dto.ventadirecta.ClienteVentaDirectaResponse;
import com.skd.sublimacion_api.dto.ventadirecta.CobroVentaRequest;
import com.skd.sublimacion_api.dto.ventadirecta.VentaDirectaRequest;
import com.skd.sublimacion_api.dto.ventadirecta.VentaDirectaResponse;
import com.skd.sublimacion_api.service.VentaDirectaService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Ventas directas: registros de ventas hechas por el administrador fuera de la
 * tienda online (mostrador, WhatsApp, ferias). Al crearlas se descuenta
 * inventario; al cancelarlas se devuelve el stock. No participan en producción.
 */
@RestController
@RequestMapping("/api/admin/ventas-directas")
@RequiredArgsConstructor
@Tag(
        name = "Administración - Ventas directas",
        description = "Registro manual de ventas fuera de la tienda con control de inventario."
)
public class AdminVentaDirectaController {

    private final VentaDirectaService ventaDirectaService;

    @Operation(summary = "Listar ventas directas",
            description = "Listado paginado con filtros opcionales por estado y por cliente (nombre o teléfono).")
    @GetMapping
    public Page<VentaDirectaResponse> listar(
            @Parameter(description = "Estado: pendiente, cobrada, cancelada")
            @RequestParam(required = false) String estado,
            @Parameter(description = "Búsqueda por nombre o teléfono del cliente")
            @RequestParam(required = false) String q,
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {

        return ventaDirectaService.listar(estado, q, pageable);
    }

    @Operation(summary = "Buscar clientes de ventas directas",
            description = "Devuelve clientes guardados que coinciden por nombre o teléfono, para autocompletar el registro.")
    @GetMapping("/clientes")
    public List<ClienteVentaDirectaResponse> listarClientes(
            @Parameter(description = "Texto a buscar (nombre o teléfono)")
            @RequestParam(required = false) String q) {

        return ventaDirectaService.listarClientes(q);
    }

    @Operation(summary = "Obtener venta directa por ID")
    @GetMapping("/{id}")
    public VentaDirectaResponse obtenerPorId(@PathVariable Long id) {
        return ventaDirectaService.obtenerPorId(id);
    }

    @Operation(summary = "Registrar venta directa",
            description = "Valida y descuenta el inventario (producto o variante) y guarda la venta.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VentaDirectaResponse crear(@Valid @RequestBody VentaDirectaRequest request) {
        return ventaDirectaService.crear(request);
    }

    @Operation(summary = "Cambiar estado de cobro",
            description = "Marca la venta como cobrada (true) o por cobrar (false). No altera stock.")
    @PatchMapping("/{id}/cobro")
    public VentaDirectaResponse cambiarCobro(
            @PathVariable Long id,
            @Valid @RequestBody CobroVentaRequest request) {

        return ventaDirectaService.cambiarCobro(id, request.getCobrado());
    }

    @Operation(summary = "Cancelar venta directa",
            description = "Cancela la venta y devuelve el stock al inventario.")
    @PostMapping("/{id}/cancelar")
    public VentaDirectaResponse cancelar(@PathVariable Long id) {
        return ventaDirectaService.cancelar(id);
    }

    @Operation(summary = "Reactivar venta directa cancelada",
            description = "Vuelve a reservar el stock (si hay disponibilidad) y la deja por cobrar.")
    @PostMapping("/{id}/reactivar")
    public VentaDirectaResponse reactivar(@PathVariable Long id) {
        return ventaDirectaService.reactivar(id);
    }
}
