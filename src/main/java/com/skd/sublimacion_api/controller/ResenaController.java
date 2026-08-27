package com.skd.sublimacion_api.controller;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.skd.sublimacion_api.dto.resena.ResenaListaResponse;
import com.skd.sublimacion_api.dto.resena.ResenaRequest;
import com.skd.sublimacion_api.dto.resena.ResenaResponse;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.exeption.BadRequestException;
import com.skd.sublimacion_api.service.ResenaService;
import com.skd.sublimacion_api.service.SupabaseStorageService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/resenas")
@RequiredArgsConstructor
public class ResenaController {

    private final ResenaService resenaService;
    private final SupabaseStorageService supabaseStorageService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResenaResponse crear(
            @Valid @RequestBody ResenaRequest request,
            @AuthenticationPrincipal Usuario usuario) {

        return resenaService.crear(request, usuario.getId());
    }

    @GetMapping("/producto/{productoId}")
    public ResenaListaResponse listarPorProducto(
            @PathVariable Long productoId,
            @PageableDefault(size = 5, sort = "creadoEn",
                    direction = Sort.Direction.DESC)
            Pageable pageable) {

        return resenaService.listarPorProducto(productoId, pageable);
    }

    /**
     * Sube la foto adjunta a una reseña y devuelve su URL pública.
     */
    @PostMapping(value = "/imagen", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> subirImagen(
            @RequestParam("file") MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Debes subir una imagen.");
        }

        byte[] contenido;
        try {
            contenido = file.getBytes();
        } catch (IOException ex) {
            throw new BadRequestException("No se pudo leer la imagen subida.");
        }

        String extension = extensionDe(file.getOriginalFilename(), file.getContentType());
        String url = supabaseStorageService.subirImagen(
                contenido, extension, file.getContentType());

        return Map.of("imagenUrl", url);
    }

    private String extensionDe(String nombreOriginal, String contentType) {

        if (nombreOriginal != null) {
            int idx = nombreOriginal.lastIndexOf('.');
            if (idx >= 0 && idx < nombreOriginal.length() - 1) {
                return nombreOriginal.substring(idx);
            }
        }

        if (contentType != null) {
            String tipo = contentType.toLowerCase(Locale.ROOT);
            if (tipo.contains("png")) return ".png";
            if (tipo.contains("webp")) return ".webp";
            if (tipo.contains("gif")) return ".gif";
            if (tipo.contains("jpeg") || tipo.contains("jpg")) return ".jpg";
        }

        return ".jpg";
    }
}
