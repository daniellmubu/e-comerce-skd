package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.diseno.DisenoPublicoResponse;
import com.skd.sublimacion_api.dto.diseno.DisenoRequest;
import com.skd.sublimacion_api.dto.diseno.DisenoResponse;
import com.skd.sublimacion_api.dto.diseno.PublicarDisenoRequest;
import com.skd.sublimacion_api.entity.OrigenDiseno;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.exeption.BadRequestException;
import com.skd.sublimacion_api.service.DisenoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/disenos")
@RequiredArgsConstructor
@Tag(name = "Diseños", description = "Generación, subida y publicación pública de diseños.")
public class DisenoController {

    private final DisenoService disenoService;

    @Operation(summary = "Generar diseño con IA")
    @PostMapping("/generar")
    @ResponseStatus(HttpStatus.CREATED)
    public DisenoResponse generar(@RequestBody DisenoRequest request,
                                   @AuthenticationPrincipal Usuario usuario) {
        return disenoService.generar(request, usuario.getId());
    }

    @Operation(summary = "Subir diseño propio")
    @PostMapping(value = "/subir", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public DisenoResponse subir(@RequestParam(value = "file", required = false) MultipartFile file,
                                 @RequestParam("productoId") Long productoId,
                                 @RequestParam(value = "origen", required = false, defaultValue = "USUARIO") OrigenDiseno origen,
                                 @AuthenticationPrincipal Usuario usuario) {

        if (origen != OrigenDiseno.USUARIO) {
            throw new BadRequestException(
                    "Solo se permite origen USUARIO en la subida de diseños.");
        }

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Debes subir una imagen.");
        }

        byte[] contenido;
        try {
            contenido = file.getBytes();
        } catch (IOException ex) {
            throw new BadRequestException("No se pudo leer la imagen subida.");
        }

        return disenoService.subir(
                contenido,
                file.getContentType(),
                file.getOriginalFilename(),
                productoId,
                usuario.getId());
    }

    @Operation(summary = "Listar mis diseños")
    @GetMapping("/usuario")
    public List<DisenoResponse> listarPorUsuario(@AuthenticationPrincipal Usuario usuario) {
        return disenoService.listarPorUsuario(usuario.getId());
    }

    @Operation(summary = "Galería pública de diseños",
            description = "Lista los diseños aprobados visibles para todos. " +
                    "Parámetro `orden`: recientes (default), megusta, usos.")
    @GetMapping("/publicos")
    public Page<DisenoPublicoResponse> listarPublicos(
            @RequestParam(value = "orden", required = false, defaultValue = "recientes") String orden,
            @PageableDefault(size = 12, sort = "publicadoEn",
                    direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal Usuario usuario) {

        Long usuarioId = usuario != null ? usuario.getId() : null;
        return disenoService.listarPublicos(orden, pageable, usuarioId);
    }

    @Operation(summary = "Detalle de un diseño público")
    @GetMapping("/publicos/{id}")
    public DisenoPublicoResponse obtenerPublico(@PathVariable Long id,
                                                @AuthenticationPrincipal Usuario usuario) {
        Long usuarioId = usuario != null ? usuario.getId() : null;
        return disenoService.obtenerPublico(id, usuarioId);
    }

    @Operation(summary = "Publicar un diseño propio en la galería")
    @PostMapping("/{id}/publicar")
    public DisenoResponse publicar(@PathVariable Long id,
                                   @RequestBody PublicarDisenoRequest request,
                                   @AuthenticationPrincipal Usuario usuario) {
        return disenoService.publicar(id, request != null ? request.getTitulo() : null, usuario.getId());
    }

    @Operation(summary = "Dar me gusta a un diseño público")
    @PostMapping("/{id}/megusta")
    public Map<String, Object> darMeGusta(@PathVariable Long id,
                                          @AuthenticationPrincipal Usuario usuario) {
        boolean registrado = disenoService.darMeGusta(id, usuario.getId());
        return Map.of("meGusta", disenoService.estaEnMeGusta(id, usuario.getId()),
                "registrado", registrado);
    }

    @Operation(summary = "Quitar me gusta de un diseño público")
    @DeleteMapping("/{id}/megusta")
    public Map<String, Object> quitarMeGusta(@PathVariable Long id,
                                             @AuthenticationPrincipal Usuario usuario) {
        disenoService.quitarMeGusta(id, usuario.getId());
        return Map.of("meGusta", disenoService.estaEnMeGusta(id, usuario.getId()));
    }

    @Operation(summary = "Estado del me gusta del usuario autenticado")
    @GetMapping("/{id}/megusta")
    public Map<String, Object> estadoMeGusta(@PathVariable Long id,
                                             @AuthenticationPrincipal Usuario usuario) {
        boolean meGusta = disenoService.estaEnMeGusta(id, usuario.getId());
        return Map.of("meGusta", meGusta);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id,
                         @AuthenticationPrincipal Usuario usuario) {
        disenoService.eliminar(id, usuario.getId());
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.OK)
    public Map<String, Object> eliminarTodos(@AuthenticationPrincipal Usuario usuario) {
        int borrados = disenoService.eliminarTodos(usuario.getId());
        return Map.of("borrados", borrados);
    }
}
