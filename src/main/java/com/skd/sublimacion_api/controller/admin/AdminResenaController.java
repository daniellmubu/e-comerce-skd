package com.skd.sublimacion_api.controller.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.skd.sublimacion_api.dto.resena.ResenaResponse;
import com.skd.sublimacion_api.service.admin.AdminResenaService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/resenas")
@RequiredArgsConstructor
@Tag(
        name = "Administración - Reseñas",
        description = "Endpoints para moderar reseñas (aprobar/rechazar) del panel administrativo."
)
public class AdminResenaController {

    private final AdminResenaService adminResenaService;

    @Operation(
        summary = "Listar reseñas",
        description = "Obtiene un listado paginado de reseñas, opcionalmente filtradas por estado (pendiente, aprobada, rechazada)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado obtenido correctamente")
    })
    @GetMapping
    public Page<ResenaResponse> listar(

            @Parameter(description = "Estado de la reseña (pendiente, aprobada, rechazada)")
            @RequestParam(required = false) String estado,

            @PageableDefault(size = 10, sort = "creadoEn",
                    direction = Sort.Direction.DESC)
            Pageable pageable) {

        return adminResenaService.listar(estado, pageable);
    }

    @Operation(
        summary = "Obtener reseña por ID",
        description = "Obtiene el detalle de una reseña específica."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Reseña encontrada"),
            @ApiResponse(responseCode = "404", description = "Reseña no encontrada")
    })
    @GetMapping("/{id}")
    public ResenaResponse obtenerPorId(@PathVariable Long id) {
        return adminResenaService.obtenerPorId(id);
    }

    @Operation(
        summary = "Aprobar reseña",
        description = "Aprueba una reseña pendiente para que sea visible públicamente."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Reseña aprobada"),
            @ApiResponse(responseCode = "404", description = "Reseña no encontrada")
    })
    @PatchMapping("/{id}/aprobar")
    public ResenaResponse aprobar(@PathVariable Long id) {
        return adminResenaService.aprobar(id);
    }

    @Operation(
        summary = "Rechazar reseña",
        description = "Rechaza una reseña para que no sea visible públicamente."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Reseña rechazada"),
            @ApiResponse(responseCode = "404", description = "Reseña no encontrada")
    })
    @PatchMapping("/{id}/rechazar")
    public ResenaResponse rechazar(@PathVariable Long id) {
        return adminResenaService.rechazar(id);
    }

    @Operation(
        summary = "Eliminar reseña",
        description = "Elimina definitivamente una reseña."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Reseña eliminada correctamente"),
            @ApiResponse(responseCode = "404", description = "Reseña no encontrada")
    })
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        adminResenaService.eliminar(id);
    }
}
