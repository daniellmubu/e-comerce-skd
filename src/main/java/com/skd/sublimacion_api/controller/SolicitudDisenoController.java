package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.solicitud.CambiosSolicitudRequest;
import com.skd.sublimacion_api.dto.solicitud.SolicitudDisenoResponse;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.exeption.BadRequestException;
import com.skd.sublimacion_api.service.SolicitudDisenoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/solicitudes-diseno")
@RequiredArgsConstructor
public class SolicitudDisenoController {

    private final SolicitudDisenoService solicitudDisenoService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public SolicitudDisenoResponse crear(
            @RequestParam(value = "productoId", required = false) Long productoId,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal Usuario usuario) {

        byte[] contenido = null;
        String contentType = null;
        String nombreArchivo = null;

        if (file != null && !file.isEmpty()) {
            try {
                contenido = file.getBytes();
            } catch (IOException ex) {
                throw new BadRequestException("No se pudo leer la imagen de referencia.");
            }
            contentType = file.getContentType();
            nombreArchivo = file.getOriginalFilename();
        }

        return solicitudDisenoService.crear(
                productoId, descripcion, contenido, contentType, nombreArchivo, usuario.getId());
    }

    @GetMapping("/mias")
    public List<SolicitudDisenoResponse> listarMias(@AuthenticationPrincipal Usuario usuario) {
        return solicitudDisenoService.listarMias(usuario.getId());
    }

    @GetMapping("/{id}")
    public SolicitudDisenoResponse obtener(@PathVariable Long id,
                                           @AuthenticationPrincipal Usuario usuario) {
        return solicitudDisenoService.obtener(id, usuario.getId());
    }

    @PostMapping("/{id}/aprobar")
    public SolicitudDisenoResponse aprobar(@PathVariable Long id,
                                           @AuthenticationPrincipal Usuario usuario) {
        return solicitudDisenoService.aprobar(id, usuario.getId());
    }

    @PostMapping("/{id}/cambios")
    public SolicitudDisenoResponse solicitarCambios(@PathVariable Long id,
                                                     @Valid @RequestBody CambiosSolicitudRequest request,
                                                     @AuthenticationPrincipal Usuario usuario) {
        return solicitudDisenoService.solicitarCambios(id, request, usuario.getId());
    }
}