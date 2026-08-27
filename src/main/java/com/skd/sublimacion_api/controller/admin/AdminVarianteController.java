package com.skd.sublimacion_api.controller.admin;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.skd.sublimacion_api.dto.variante.VarianteRequest;
import com.skd.sublimacion_api.dto.variante.VarianteResponse;
import com.skd.sublimacion_api.service.admin.AdminVarianteService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/variantes")
@RequiredArgsConstructor
@Tag(
        name = "Administración - Variantes",
        description = "Endpoints para la gestión de variantes (talla/color/stock/precio) de productos."
)
public class AdminVarianteController {

    private final AdminVarianteService adminVarianteService;

    @Operation(
        summary = "Listar variantes de un producto",
        description = "Obtiene todas las variantes de un producto específico."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado obtenido correctamente"),
            @ApiResponse(responseCode = "404", description = "Producto no encontrado")
    })
    @GetMapping("/producto/{productoId}")
    public List<VarianteResponse> listarPorProducto(
            @PathVariable Long productoId) {

        return adminVarianteService.listarPorProducto(productoId);
    }

    @Operation(
        summary = "Obtener variante por ID",
        description = "Obtiene la información de una variante específica."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Variante encontrada"),
            @ApiResponse(responseCode = "404", description = "Variante no encontrada")
    })
    @GetMapping("/{id}")
    public VarianteResponse obtenerPorId(@PathVariable Long id) {
        return adminVarianteService.obtenerPorId(id);
    }

    @Operation(
        summary = "Crear variante",
        description = "Registra una nueva variante para un producto."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Variante creada correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VarianteResponse guardar(
            @Valid @RequestBody VarianteRequest request) {

        return adminVarianteService.guardar(request);
    }

    @Operation(
        summary = "Actualizar variante",
        description = "Actualiza la información de una variante."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Variante actualizada correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos"),
            @ApiResponse(responseCode = "404", description = "Variante no encontrada")
    })
    @PutMapping("/{id}")
    public VarianteResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody VarianteRequest request) {

        return adminVarianteService.actualizar(id, request);
    }

    @Operation(
        summary = "Eliminar variante",
        description = "Elimina definitivamente una variante."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Variante eliminada correctamente"),
            @ApiResponse(responseCode = "404", description = "Variante no encontrada")
    })
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        adminVarianteService.eliminar(id);
    }
}
