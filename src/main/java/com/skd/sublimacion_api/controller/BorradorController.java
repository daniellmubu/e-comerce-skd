package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.entity.BorradorEditable;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.exeption.BadRequestException;
import com.skd.sublimacion_api.exeption.ForbiddenException;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.BorradorEditableRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Borradores del personalizador guardados en la nube.
 * Cada borrador pertenece a un usuario; listar/leer/borrar siempre se
 * resuelven contra el usuario autenticado (nunca se expone el de otro).
 * El QR de "continuar en mi celular" apunta a /personalizador?borrador={id}.
 */
@RestController
@RequestMapping("/api/borradores")
@RequiredArgsConstructor
public class BorradorController {

    private final BorradorEditableRepository borradorRepository;
    private final UsuarioRepository usuarioRepository;

    /** Lista de borradores de la cuenta (sin el snapshot, para que sea ligera). */
    @GetMapping
    public List<Map<String, Object>> listar(@AuthenticationPrincipal Usuario usuario) {
        return borradorRepository.findByUsuarioIdOrderByCreadoEnDesc(usuario.getId()).stream()
                .map(b -> Map.<String, Object>of(
                        "id", b.getId(),
                        "nombre", b.getNombre(),
                        "creadoEn", b.getCreadoEn() == null ? "" : b.getCreadoEn().toString()))
                .toList();
    }

    /** Devuelve el snapshot completo de un borrador (solo el dueño). */
    @GetMapping("/{id}")
    public Map<String, Object> obtener(@AuthenticationPrincipal Usuario usuario,
                                       @PathVariable Long id) {
        BorradorEditable borrador = borradorRepository.findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Borrador no encontrado"));
        return Map.of("id", borrador.getId(), "nombre", borrador.getNombre(), "snapshot", borrador.getSnapshot());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> guardar(@AuthenticationPrincipal Usuario usuario,
                                                       @RequestBody Map<String, String> body) {

        String nombre = body.get("nombre");
        String snapshot = body.get("snapshot");

        if (nombre == null || nombre.isBlank()) {
            throw new BadRequestException("El nombre del borrador es obligatorio.");
        }
        if (snapshot == null || snapshot.isBlank()) {
            throw new BadRequestException("El borrador está vacío.");
        }
        if (snapshot.length() > 4_000_000) {
            throw new BadRequestException("El diseño es demasiado grande para guardarlo en la nube.");
        }

        Usuario user = usuarioRepository.findById(usuario.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        BorradorEditable borrador = BorradorEditable.builder()
                .usuario(user)
                .nombre(nombre.trim())
                .snapshot(snapshot)
                .build();

        borrador = borradorRepository.save(borrador);

        return ResponseEntity.ok(Map.of(
                "id", borrador.getId(),
                "nombre", borrador.getNombre(),
                "creadoEn", borrador.getCreadoEn() == null ? "" : borrador.getCreadoEn().toString()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> eliminar(@AuthenticationPrincipal Usuario usuario,
                                                        @PathVariable Long id) {
        BorradorEditable borrador = borradorRepository.findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() -> new ForbiddenException("No puedes borrar un borrador que no te pertenece."));
        borradorRepository.delete(borrador);
        return ResponseEntity.ok(Map.of("borrado", true));
    }
}
