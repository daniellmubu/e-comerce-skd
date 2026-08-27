package com.skd.sublimacion_api.service.impl.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skd.sublimacion_api.dto.resena.ResenaResponse;
import com.skd.sublimacion_api.entity.Resena;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.ResenaRepository;
import com.skd.sublimacion_api.service.admin.AdminResenaService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminResenaServiceImpl implements AdminResenaService {

    public static final String ESTADO_PENDIENTE = "pendiente";
    public static final String ESTADO_APROBADA = "aprobada";
    public static final String ESTADO_RECHAZADA = "rechazada";

    private final ResenaRepository resenaRepository;

    @Override
    public Page<ResenaResponse> listar(String estado, Pageable pageable) {

        Page<Resena> pagina;

        if (estado != null && !estado.isBlank()) {
            pagina = resenaRepository.findByEstado(estado.trim().toLowerCase(), pageable);
        } else {
            pagina = resenaRepository.findAll(pageable);
        }

        return pagina.map(this::convertir);
    }

    @Override
    public ResenaResponse obtenerPorId(Long id) {
        return convertir(buscarResena(id));
    }

    @Override
    @Transactional
    public ResenaResponse aprobar(Long id) {
        Resena resena = buscarResena(id);
        resena.setEstado(ESTADO_APROBADA);
        return convertir(resenaRepository.save(resena));
    }

    @Override
    @Transactional
    public ResenaResponse rechazar(Long id) {
        Resena resena = buscarResena(id);
        resena.setEstado(ESTADO_RECHAZADA);
        return convertir(resenaRepository.save(resena));
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        resenaRepository.delete(buscarResena(id));
    }

    private Resena buscarResena(Long id) {
        return resenaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Reseña no encontrada con id: " + id));
    }

    private ResenaResponse convertir(Resena resena) {

        return ResenaResponse.builder()
                .id(resena.getId())
                .productoId(resena.getProducto().getId())
                .productoNombre(resena.getProducto().getNombre())
                .usuarioId(resena.getUsuario().getId())
                .usuarioNombre(resena.getUsuario().getNombre())
                .calificacion(resena.getCalificacion())
                .comentario(resena.getComentario())
                .imagenUrl(resena.getImagenUrl())
                .estado(resena.getEstado())
                .creadoEn(resena.getCreadoEn())
                .compraVerificada(true)
                .build();
    }
}
