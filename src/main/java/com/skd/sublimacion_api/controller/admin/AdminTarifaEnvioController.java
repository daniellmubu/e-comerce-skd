package com.skd.sublimacion_api.controller.admin;

import com.skd.sublimacion_api.dto.tarifa.TarifaEnvioRequest;
import com.skd.sublimacion_api.dto.tarifa.TarifaEnvioResponse;
import com.skd.sublimacion_api.service.admin.AdminTarifaEnvioService;

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
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/tarifas-envio")
@RequiredArgsConstructor
@Tag(
        name = "Administración - Tarifas de envío",
        description = "Endpoints para la gestión de tarifas de envío por departamento."
)
public class AdminTarifaEnvioController {

    private final AdminTarifaEnvioService adminTarifaEnvioService;

    @Operation(
        summary = "Listar tarifas de envío",
        description = "Obtiene un listado paginado de tarifas con filtro opcional por departamento."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado obtenido correctamente")
    })
    @GetMapping
    public Page<TarifaEnvioResponse> listar(

            @Parameter(description = "Departamento")
            @RequestParam(required = false) String departamento,

            @PageableDefault(size = 10, sort = "departamento")
            Pageable pageable) {

        return adminTarifaEnvioService.listar(departamento, pageable);
    }

    @Operation(
        summary = "Obtener tarifa por ID",
        description = "Obtiene la información de una tarifa de envío."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tarifa encontrada"),
            @ApiResponse(responseCode = "404", description = "Tarifa no encontrada")
    })
    @GetMapping("/{id}")
    public TarifaEnvioResponse obtenerPorId(@PathVariable Long id) {
        return adminTarifaEnvioService.obtenerPorId(id);
    }

    @Operation(
        summary = "Crear tarifa",
        description = "Registra una nueva tarifa de envío para un departamento."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Tarifa creada correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos o departamento duplicado")
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TarifaEnvioResponse guardar(
            @Valid @RequestBody TarifaEnvioRequest request) {

        return adminTarifaEnvioService.guardar(request);
    }

    @Operation(
        summary = "Actualizar tarifa",
        description = "Actualiza la información de una tarifa de envío."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tarifa actualizada"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos o departamento duplicado"),
            @ApiResponse(responseCode = "404", description = "Tarifa no encontrada")
    })
    @PutMapping("/{id}")
    public TarifaEnvioResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody TarifaEnvioRequest request) {

        return adminTarifaEnvioService.actualizar(id, request);
    }

    @Operation(
        summary = "Eliminar tarifa",
        description = "Elimina una tarifa de envío."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Tarifa eliminada"),
            @ApiResponse(responseCode = "404", description = "Tarifa no encontrada")
    })
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        adminTarifaEnvioService.eliminar(id);
    }
}