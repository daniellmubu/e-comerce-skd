package com.skd.sublimacion_api.controller.admin;

import com.skd.sublimacion_api.dto.dashboard.ProductoMasVendidoResponse;
import com.skd.sublimacion_api.dto.estadisticas.ResumenEstadisticasResponse;
import com.skd.sublimacion_api.dto.estadisticas.VentaDiariaResponse;
import com.skd.sublimacion_api.service.admin.AdminEstadisticasService;

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

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/estadisticas")
@RequiredArgsConstructor
@Tag(
        name = "Administración - Estadísticas",
        description = "Endpoints de estadísticas de ventas para el dashboard administrativo."
)
public class AdminEstadisticasController {

    private final AdminEstadisticasService adminEstadisticasService;

    @Operation(
        summary = "Ventas por día",
        description = "Totales de ventas (solo pagos aprobados) agrupados por día. Si no se envían fechas, devuelve los últimos 30 días."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Datos obtenidos correctamente"),
            @ApiResponse(responseCode = "400", description = "Rango de fechas inválido")
    })
    @GetMapping("/ventas")
    public List<VentaDiariaResponse> ventas(

            @Parameter(description = "Fecha inicial (formato yyyy-MM-dd)")
            @RequestParam(required = false) LocalDate desde,

            @Parameter(description = "Fecha final (formato yyyy-MM-dd)")
            @RequestParam(required = false) LocalDate hasta) {

        return adminEstadisticasService.ventasPorDia(desde, hasta);
    }

    @Operation(
        summary = "Productos más vendidos",
        description = "Top de productos por unidades vendidas (solo pagos aprobados)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado obtenido correctamente")
    })
    @GetMapping("/productos-mas-vendidos")
    public List<ProductoMasVendidoResponse> productosMasVendidos(
            @Parameter(description = "Cantidad máxima de productos (por defecto 10)")
            @RequestParam(defaultValue = "10") int limite) {

        return adminEstadisticasService.productosMasVendidos(limite);
    }

    @Operation(
        summary = "Resumen general",
        description = "Ingresos totales, número de pedidos con pago aprobado y ticket promedio."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Resumen obtenido correctamente")
    })
    @GetMapping("/resumen")
    public ResumenEstadisticasResponse resumen() {
        return adminEstadisticasService.resumen();
    }
}