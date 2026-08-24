package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.diseno.DisenoRequest;
import com.skd.sublimacion_api.dto.diseno.DisenoResponse;
import com.skd.sublimacion_api.entity.OrigenDiseno;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.exeption.BadRequestException;
import com.skd.sublimacion_api.service.DisenoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/disenos")
@RequiredArgsConstructor
public class DisenoController {

    private final DisenoService disenoService;

    @PostMapping("/generar")
    @ResponseStatus(HttpStatus.CREATED)
    public DisenoResponse generar(@RequestBody DisenoRequest request,
                                   @AuthenticationPrincipal Usuario usuario) {
        return disenoService.generar(request, usuario.getId());
    }

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

    @GetMapping("/usuario")
    public List<DisenoResponse> listarPorUsuario(@AuthenticationPrincipal Usuario usuario) {
        return disenoService.listarPorUsuario(usuario.getId());
    }
}
