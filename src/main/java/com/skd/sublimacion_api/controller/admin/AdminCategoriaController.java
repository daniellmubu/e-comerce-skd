package com.skd.sublimacion_api.controller.admin;

import com.skd.sublimacion_api.dto.categoria.CategoriaRequest;
import com.skd.sublimacion_api.dto.categoria.CategoriaResponse;
import com.skd.sublimacion_api.service.admin.AdminCategoriaService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;


@RestController
@RequestMapping("/api/admin/categorias")
@RequiredArgsConstructor
@Tag(
        name = "Administración - Categorías",
        description = "Endpoints para la gestión de categorías del panel administrativo."
)
public class AdminCategoriaController {

    private final AdminCategoriaService adminCategoriaService;

    @Operation(
        summary = "Listar categorías",
        description = "Obtiene un listado paginado de categorías."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado obtenido correctamente")
    })
    @GetMapping
    public Page<CategoriaResponse> listar(
            @PageableDefault(size = 10, sort = "id")
            Pageable pageable) {

        return adminCategoriaService.listar(pageable);
    }


    @Operation(
        summary = "Obtener categoría por ID",
        description = "Obtiene la información de una categoría."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Categoría encontrada"),
            @ApiResponse(responseCode = "404", description = "Categoría no encontrada")
    })
    @GetMapping("/{id}")
    public CategoriaResponse obtenerPorId(
            @PathVariable Long id) {

        return adminCategoriaService.obtenerPorId(id);
    }


    @Operation(
        summary = "Crear categoría",
        description = "Registra una nueva categoría."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Categoría creada correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoriaResponse guardar(
            @Valid @RequestBody CategoriaRequest request) {

        return adminCategoriaService.guardar(request);
    }


    @Operation(
            summary = "Actualizar categoría",
            description = "Actualiza la información de una categoría."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Categoría actualizada"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos"),
            @ApiResponse(responseCode = "404", description = "Categoría no encontrada")
    })
    @PutMapping("/{id}")
    public CategoriaResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody CategoriaRequest request) {

        return adminCategoriaService.actualizar(id, request);
    }


    @Operation(
        summary = "Eliminar categoría",
        description = "Elimina una categoría siempre que no tenga productos o subcategorías asociadas."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Categoría eliminada"),
            @ApiResponse(responseCode = "400", description = "La categoría tiene productos o subcategorías"),
            @ApiResponse(responseCode = "404", description = "Categoría no encontrada")
    })
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {

        adminCategoriaService.eliminar(id);
    }
}