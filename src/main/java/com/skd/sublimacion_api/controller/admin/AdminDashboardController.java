package com.skd.sublimacion_api.controller.admin;

import com.skd.sublimacion_api.dto.dashboard.ProductoMasVendidoResponse;
import com.skd.sublimacion_api.dto.dashboard.ResumenDashboardResponse;
import com.skd.sublimacion_api.dto.dashboard.VentaPeriodoResponse;
import com.skd.sublimacion_api.service.admin.AdminDashboardService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@Tag(
        name = "Administración - Dashboard",
        description = "Endpoints de estadísticas para el panel administrativo."
)
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @Operation(
        summary = "Resumen general",
        description = "Totales de usuarios, productos, pedidos, ventas y pedidos por estado."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Resumen obtenido correctamente")
    })
    @GetMapping("/resumen")
    public ResumenDashboardResponse resumen() {
        return adminDashboardService.resumen();
    }

    @Operation(
        summary = "Productos más vendidos",
        description = "Top de productos por unidades vendidas."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado obtenido correctamente")
    })
    @GetMapping("/productos-mas-vendidos")
    public List<ProductoMasVendidoResponse> productosMasVendidos(
            @Parameter(description = "Cantidad máxima de productos (por defecto 5)")
            @RequestParam(defaultValue = "5") int limite) {

        return adminDashboardService.productosMasVendidos(limite);
    }

    @Operation(
        summary = "Ventas por periodo",
        description = "Suma de ventas agrupada por mes (formato YYYY-MM)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado obtenido correctamente")
    })
    @GetMapping("/ventas-por-periodo")
    public List<VentaPeriodoResponse> ventasPorPeriodo() {
        return adminDashboardService.ventasPorPeriodo();
    }
}
