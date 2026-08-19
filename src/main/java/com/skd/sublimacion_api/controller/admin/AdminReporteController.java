package com.skd.sublimacion_api.controller.admin;

import com.skd.sublimacion_api.service.admin.AdminReporteService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/reportes")
@RequiredArgsConstructor
@Tag(
        name = "Administración - Reportes",
        description = "Endpoints de exportación de reportes del panel administrativo (PDF y CSV)."
)
public class AdminReporteController {

    private final AdminReporteService adminReporteService;

    @Operation(
        summary = "Exportar reporte CSV",
        description = "Descarga un reporte en CSV (abre en Excel). Tipos: ventas, pedidos, usuarios, productos."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Archivo CSV generado"),
            @ApiResponse(responseCode = "400", description = "Tipo de reporte inválido")
    })
    @GetMapping("/{tipo}/csv")
    public ResponseEntity<byte[]> exportarCsv(
            @Parameter(description = "Tipo de reporte (ventas, pedidos, usuarios, productos)")
            @PathVariable String tipo) {

        byte[] datos = adminReporteService.exportarCsv(tipo);
        String nombre = "reporte_" + tipo.toLowerCase() + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + nombre + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(datos);
    }

    @Operation(
        summary = "Exportar reporte PDF",
        description = "Descarga un reporte en PDF. Tipos: ventas, pedidos, usuarios, productos."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Archivo PDF generado"),
            @ApiResponse(responseCode = "400", description = "Tipo de reporte inválido")
    })
    @GetMapping("/{tipo}/pdf")
    public ResponseEntity<byte[]> exportarPdf(
            @Parameter(description = "Tipo de reporte (ventas, pedidos, usuarios, productos)")
            @PathVariable String tipo) {

        byte[] datos = adminReporteService.exportarPdf(tipo);
        String nombre = "reporte_" + tipo.toLowerCase() + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + nombre + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(datos);
    }
}
