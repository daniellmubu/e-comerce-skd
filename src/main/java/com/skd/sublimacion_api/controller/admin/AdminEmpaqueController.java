package com.skd.sublimacion_api.controller.admin;

import com.skd.sublimacion_api.dto.empaque.EmpaqueRequest;
import com.skd.sublimacion_api.dto.empaque.EmpaqueResponse;
import com.skd.sublimacion_api.service.admin.AdminEmpaqueService;

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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/empaques")
@RequiredArgsConstructor
@Tag(
        name = "Administración - Empaques",
        description = "Endpoints para la gestión de empaques del panel administrativo."
)
public class AdminEmpaqueController {

    private final AdminEmpaqueService adminEmpaqueService;

    @Operation(
        summary = "Listar empaques",
        description = "Obtiene un listado paginado de empaques con filtro opcional por tipo."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado obtenido correctamente")
    })
    @GetMapping
    public Page<EmpaqueResponse> listar(

            @Parameter(description = "Tipo de empaque")
            @RequestParam(required = false) String tipo,

            @PageableDefault(size = 10, sort = "id")
            Pageable pageable) {

        return adminEmpaqueService.listar(tipo, pageable);
    }

    @Operation(
        summary = "Obtener empaque por ID",
        description = "Obtiene la información de un empaque."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Empaque encontrado"),
            @ApiResponse(responseCode = "404", description = "Empaque no encontrado")
    })
    @GetMapping("/{id}")
    public EmpaqueResponse obtenerPorId(@PathVariable Long id) {
        return adminEmpaqueService.obtenerPorId(id);
    }

    @Operation(
        summary = "Crear empaque",
        description = "Registra un nuevo empaque."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Empaque creado correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EmpaqueResponse guardar(
            @Valid @RequestBody EmpaqueRequest request) {

        return adminEmpaqueService.guardar(request);
    }

    @Operation(
        summary = "Actualizar empaque",
        description = "Actualiza la información de un empaque."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Empaque actualizado"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos"),
            @ApiResponse(responseCode = "404", description = "Empaque no encontrado")
    })
    @PutMapping("/{id}")
    public EmpaqueResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody EmpaqueRequest request) {

        return adminEmpaqueService.actualizar(id, request);
    }

    @Operation(
        summary = "Eliminar empaque",
        description = "Elimina un empaque siempre que no tenga pedidos asociados."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Empaque eliminado"),
            @ApiResponse(responseCode = "400", description = "El empaque tiene pedidos asociados"),
            @ApiResponse(responseCode = "404", description = "Empaque no encontrado")
    })
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        adminEmpaqueService.eliminar(id);
    }
}
