package com.skd.sublimacion_api.controller.admin;

import com.skd.sublimacion_api.dto.cupon.CuponRequest;
import com.skd.sublimacion_api.dto.cupon.CuponResponse;
import com.skd.sublimacion_api.service.admin.AdminCuponService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/cupones")
@RequiredArgsConstructor
@Tag(
        name = "Administración - Cupones",
        description = "Endpoints para la gestión de cupones de descuento."
)
public class AdminCuponController {

    private final AdminCuponService adminCuponService;


    @Operation(
        summary = "Listar cupones",
        description = "Obtiene un listado paginado de cupones con filtros opcionales."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado obtenido correctamente")
    })
    @GetMapping
    public Page<CuponResponse> listar(

            @RequestParam(required = false) String codigo,

            @RequestParam(required = false) Boolean activo,

            @RequestParam(required = false) LocalDate fechaInicio,

            @RequestParam(required = false) LocalDate fechaFin,

            @PageableDefault(size = 10, sort = "id")
            Pageable pageable) {

        return adminCuponService.listar(
                codigo,
                activo,
                fechaInicio,
                fechaFin,
                pageable);
    }


    @Operation(
        summary = "Obtener cupón por ID",
        description = "Obtiene la información de un cupón."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cupón encontrado"),
            @ApiResponse(responseCode = "404", description = "Cupón no encontrado")
    })
    @GetMapping("/{id}")
    public CuponResponse obtenerPorId(
            @PathVariable Long id) {

        return adminCuponService.obtenerPorId(id);
    }


    @Operation(
        summary = "Crear cupón",
        description = "Registra un nuevo cupón de descuento."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Cupón creado correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CuponResponse guardar(
            @Valid @RequestBody CuponRequest request) {

        return adminCuponService.guardar(request);
    }


    @Operation(
        summary = "Actualizar cupón",
        description = "Actualiza la información de un cupón."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cupón actualizado"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos"),
            @ApiResponse(responseCode = "404", description = "Cupón no encontrado")
    })
    @PutMapping("/{id}")
    public CuponResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody CuponRequest request) {

        return adminCuponService.actualizar(id, request);
    }


    @Operation(
        summary = "Eliminar cupón",
        description = "Realiza un borrado lógico del cupón."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Cupón eliminado"),
            @ApiResponse(responseCode = "404", description = "Cupón no encontrado")
    })
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(
            @PathVariable Long id) {

        adminCuponService.eliminar(id);
    }
}