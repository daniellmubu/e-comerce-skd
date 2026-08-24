package com.skd.sublimacion_api.controller.admin;

import com.skd.sublimacion_api.dto.solicitud.CambiarEstadoSolicitudRequest;
import com.skd.sublimacion_api.dto.solicitud.SolicitudDisenoResponse;
import com.skd.sublimacion_api.entity.EstadoSolicitudDiseno;
import com.skd.sublimacion_api.exeption.BadRequestException;
import com.skd.sublimacion_api.service.admin.AdminSolicitudDisenoService;

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
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/admin/solicitudes-diseno")
@RequiredArgsConstructor
@Tag(
        name = "Administración - Solicitudes de diseño",
        description = "Gestión de solicitudes de diseño asistido por el equipo de SKD."
)
public class AdminSolicitudDisenoController {

    private final AdminSolicitudDisenoService adminSolicitudDisenoService;

    @Operation(summary = "Listar solicitudes", description = "Lista paginada de solicitudes con filtro opcional por estado.")
    @ApiResponses({ @ApiResponse(responseCode = "200", description = "Listado obtenido correctamente") })
    @GetMapping
    public Page<SolicitudDisenoResponse> listar(
            @Parameter(description = "Estado de la solicitud")
            @RequestParam(required = false) EstadoSolicitudDiseno estado,
            @PageableDefault(size = 10, sort = "creadoEn") Pageable pageable) {
        return adminSolicitudDisenoService.listar(estado, pageable);
    }

    @Operation(summary = "Obtener solicitud", description = "Obtiene el detalle de una solicitud.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Solicitud encontrada"),
            @ApiResponse(responseCode = "404", description = "Solicitud no encontrada")
    })
    @GetMapping("/{id}")
    public SolicitudDisenoResponse obtenerPorId(@PathVariable Long id) {
        return adminSolicitudDisenoService.obtenerPorId(id);
    }

    @Operation(summary = "Cambiar estado", description = "Permite tomar la solicitud (mover a EN_DISENO).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estado actualizado"),
            @ApiResponse(responseCode = "400", description = "Transición no permitida"),
            @ApiResponse(responseCode = "404", description = "Solicitud no encontrada")
    })
    @PatchMapping("/{id}/estado")
    public SolicitudDisenoResponse cambiarEstado(
            @PathVariable Long id,
            @Valid @RequestBody CambiarEstadoSolicitudRequest request) {
        return adminSolicitudDisenoService.cambiarEstado(id, request.getEstado());
    }

    @Operation(summary = "Enviar propuesta", description = "Sube la imagen de la propuesta y notifica al cliente.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Propuesta enviada"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos o estado no permitido"),
            @ApiResponse(responseCode = "404", description = "Solicitud no encontrada")
    })
    @PostMapping(value = "/{id}/propuesta", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.OK)
    public SolicitudDisenoResponse enviarPropuesta(
            @PathVariable Long id,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "mensajeAdmin", required = false) String mensajeAdmin) {

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Debes subir la imagen de la propuesta.");
        }

        byte[] contenido;
        try {
            contenido = file.getBytes();
        } catch (IOException ex) {
            throw new BadRequestException("No se pudo leer la imagen subida.");
        }

        return adminSolicitudDisenoService.enviarPropuesta(
                id, contenido, file.getContentType(), file.getOriginalFilename(), mensajeAdmin);
    }
}