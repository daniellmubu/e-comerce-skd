package com.skd.sublimacion_api.service.impl.admin;

import com.skd.sublimacion_api.dto.empaque.EmpaqueRequest;
import com.skd.sublimacion_api.dto.empaque.EmpaqueResponse;
import com.skd.sublimacion_api.entity.Empaque;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.EmpaqueRepository;
import com.skd.sublimacion_api.repository.PedidoRepository;
import com.skd.sublimacion_api.service.SupabaseStorageService;
import com.skd.sublimacion_api.service.admin.AdminEmpaqueService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AdminEmpaqueServiceImpl implements AdminEmpaqueService {

    private final EmpaqueRepository empaqueRepository;
    private final PedidoRepository pedidoRepository;
    private final SupabaseStorageService supabaseStorageService;

    @Override
    public Page<EmpaqueResponse> listar(String tipo, Pageable pageable) {

        if (tipo == null || tipo.isBlank()) {
            return empaqueRepository.findAll(pageable).map(this::convertir);
        }

        return empaqueRepository
                .findByTipoContainingIgnoreCase(tipo.trim(), pageable)
                .map(this::convertir);
    }

    @Override
    public EmpaqueResponse obtenerPorId(Long id) {
        return convertir(obtenerEmpaque(id));
    }

    @Override
    @Transactional
    public EmpaqueResponse guardar(EmpaqueRequest request) {

        validarTipo(request.getTipo(), null);

        Empaque empaque = Empaque.builder()
                .tipo(request.getTipo().trim())
                .descripcion(request.getDescripcion())
                .costoAdicional(
                        request.getCostoAdicional() == null
                                ? BigDecimal.ZERO
                                : request.getCostoAdicional())
                .build();

        return convertir(empaqueRepository.save(empaque));
    }

    @Override
    @Transactional
    public EmpaqueResponse actualizar(Long id, EmpaqueRequest request) {

        Empaque empaque = obtenerEmpaque(id);
        validarTipo(request.getTipo(), empaque);

        empaque.setTipo(request.getTipo().trim());
        empaque.setDescripcion(request.getDescripcion());
        empaque.setCostoAdicional(
                request.getCostoAdicional() == null
                        ? BigDecimal.ZERO
                        : request.getCostoAdicional());
        // La imagen se conserva si el request no la trae (se sube por separado).
        if (request.getImagenUrl() != null) {
            empaque.setImagenUrl(request.getImagenUrl());
        }

        return convertir(empaqueRepository.save(empaque));
    }

    @Override
    @Transactional
    public EmpaqueResponse subirImagen(Long id, byte[] imagenBytes, String contentType, String nombreOriginal) {
        if (imagenBytes == null || imagenBytes.length == 0) {
            throw new IllegalArgumentException("Debes enviar una imagen válida.");
        }
        Empaque empaque = obtenerEmpaque(id);
        String extension = extensionDe(nombreOriginal, contentType);
        String url = supabaseStorageService.subirImagen(imagenBytes, extension, contentType);
        empaque.setImagenUrl(url);
        return convertir(empaqueRepository.save(empaque));
    }

    @Override
    @Transactional
    public void eliminar(Long id) {

        Empaque empaque = obtenerEmpaque(id);

        if (pedidoRepository.existsByEmpaqueId(id)) {
            throw new IllegalStateException(
                    "No se puede eliminar el empaque porque tiene pedidos asociados.");
        }

        empaqueRepository.delete(empaque);
    }

    private Empaque obtenerEmpaque(Long id) {
        return empaqueRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Empaque no encontrado con id: " + id));
    }

    private void validarTipo(String tipo, Empaque actual) {

        if (tipo == null || tipo.isBlank()) {
            throw new IllegalArgumentException(
                    "El tipo de empaque es obligatorio");
        }

        empaqueRepository.findByTipo(tipo.trim())
                .filter(e -> actual == null || !e.getId().equals(actual.getId()))
                .ifPresent(e -> {
                    throw new IllegalArgumentException(
                            "Ya existe un empaque con ese tipo");
                });
    }

    private String extensionDe(String nombreOriginal, String contentType) {
        if (nombreOriginal != null) {
            int idx = nombreOriginal.lastIndexOf('.');
            if (idx >= 0 && idx < nombreOriginal.length() - 1) {
                return nombreOriginal.substring(idx).toLowerCase(Locale.ROOT);
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

    private EmpaqueResponse convertir(Empaque empaque) {

        return EmpaqueResponse.builder()
                .id(empaque.getId())
                .tipo(empaque.getTipo())
                .descripcion(empaque.getDescripcion())
                .costoAdicional(empaque.getCostoAdicional())
                .imagenUrl(empaque.getImagenUrl())
                .build();
    }
}
