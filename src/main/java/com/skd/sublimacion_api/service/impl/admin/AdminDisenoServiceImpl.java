package com.skd.sublimacion_api.service.impl.admin;

import com.skd.sublimacion_api.dto.diseno.DisenoAdminResponse;
import com.skd.sublimacion_api.entity.Diseno;
import com.skd.sublimacion_api.entity.EstadoPublicacionDiseno;
import com.skd.sublimacion_api.exeption.BadRequestException;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.DisenoMeGustaRepository;
import com.skd.sublimacion_api.repository.DisenoRepository;
import com.skd.sublimacion_api.repository.ItemCarritoRepository;
import com.skd.sublimacion_api.repository.ItemPedidoRepository;
import com.skd.sublimacion_api.repository.SolicitudDisenoRepository;
import com.skd.sublimacion_api.service.admin.AdminDisenoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminDisenoServiceImpl implements AdminDisenoService {

    private final DisenoRepository disenoRepository;
    private final DisenoMeGustaRepository disenoMeGustaRepository;
    private final SolicitudDisenoRepository solicitudDisenoRepository;
    private final ItemPedidoRepository itemPedidoRepository;
    private final ItemCarritoRepository itemCarritoRepository;

    @Override
    public Page<DisenoAdminResponse> listar(String estado, String busqueda, Pageable pageable) {

        EstadoPublicacionDiseno estadoEnum = parsearEstado(estado);
        String busquedaLimpia = (busqueda == null || busqueda.isBlank()) ? null : busqueda.trim();

        Page<Diseno> pagina;
        if (estadoEnum != null && busquedaLimpia != null) {
            pagina = disenoRepository.findByEstadoPublicacionAndTituloContainingIgnoreCase(
                    estadoEnum, busquedaLimpia, pageable);
        } else if (estadoEnum != null) {
            pagina = disenoRepository.findByEstadoPublicacion(estadoEnum, pageable);
        } else if (busquedaLimpia != null) {
            pagina = disenoRepository.findByTituloContainingIgnoreCase(busquedaLimpia, pageable);
        } else {
            pagina = disenoRepository.findAll(pageable);
        }

        return pagina.map(this::convertir);
    }

    @Override
    public DisenoAdminResponse obtenerPorId(Long id) {
        return convertir(buscar(id));
    }

    @Override
    public Map<String, Long> resumen() {

        Map<String, Long> conteo = new LinkedHashMap<>();
        for (EstadoPublicacionDiseno estado : EstadoPublicacionDiseno.values()) {
            conteo.put(estado.name().toLowerCase(), disenoRepository.countByEstadoPublicacion(estado));
        }
        // Diseños que nunca se enviaron a moderación.
        conteo.put("no_publicado",
                disenoRepository.count() - conteo.values().stream().mapToLong(Long::longValue).sum());
        return conteo;
    }

    @Override
    @Transactional
    public DisenoAdminResponse aprobar(Long id) {

        Diseno diseno = buscar(id);
        if (diseno.getEstadoPublicacion() == null) {
            throw new BadRequestException("Este diseño nunca fue enviado a moderación.");
        }
        diseno.setEstadoPublicacion(EstadoPublicacionDiseno.PUBLICADO);
        diseno.setMotivoRechazo(null);
        if (diseno.getPublicadoEn() == null) {
            diseno.setPublicadoEn(LocalDateTime.now());
        }
        return convertir(disenoRepository.save(diseno));
    }

    @Override
    @Transactional
    public DisenoAdminResponse rechazar(Long id, String motivo) {

        Diseno diseno = buscar(id);
        if (diseno.getEstadoPublicacion() == null) {
            throw new BadRequestException("Este diseño nunca fue enviado a moderación.");
        }
        diseno.setEstadoPublicacion(EstadoPublicacionDiseno.RECHAZADO);
        diseno.setMotivoRechazo(validarMotivo(motivo));
        return convertir(disenoRepository.save(diseno));
    }

    @Override
    @Transactional
    public DisenoAdminResponse ocultar(Long id, String motivo) {

        Diseno diseno = buscar(id);
        diseno.setEstadoPublicacion(EstadoPublicacionDiseno.OCULTO);
        diseno.setMotivoRechazo(validarMotivo(motivo));
        return convertir(disenoRepository.save(diseno));
    }

    @Override
    public List<DisenoAdminResponse> topMeGusta(int limite) {
        int tope = Math.min(Math.max(limite, 1), 50);
        return disenoRepository
                .findTopByMeGusta(EstadoPublicacionDiseno.PUBLICADO, PageRequest.of(0, tope))
                .stream()
                .map(this::convertir)
                .toList();
    }

    @Override
    public List<DisenoAdminResponse> topUsos(int limite) {
        int tope = Math.min(Math.max(limite, 1), 50);
        return disenoRepository
                .findByEstadoPublicacionOrderByVecesUsadoDesc(
                        EstadoPublicacionDiseno.PUBLICADO, PageRequest.of(0, tope))
                .stream()
                .map(this::convertir)
                .toList();
    }

    @Override
    @Transactional
    public void eliminar(Long id) {

        Diseno diseno = buscar(id);

        if (Boolean.TRUE.equals(diseno.getUsado())
                || solicitudDisenoRepository.existsByDisenoId(id)
                || itemPedidoRepository.existsByDisenoId(id)
                || itemCarritoRepository.existsByDisenoId(id)) {
            throw new BadRequestException(
                    "No se puede borrar: el diseño está usado en pedidos. Usa 'Ocultar' en su lugar.");
        }

        disenoMeGustaRepository.deleteByDisenoId(id);
        disenoRepository.delete(diseno);
    }

    // ------------------------------------------------------------------

    private Diseno buscar(Long id) {
        return disenoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Diseño no encontrado con id: " + id));
    }

    private String validarMotivo(String motivo) {
        if (motivo == null || motivo.isBlank()) {
            throw new BadRequestException("Debes indicar un motivo.");
        }
        String limpio = motivo.trim();
        if (limpio.length() > 500) {
            throw new BadRequestException("El motivo no puede superar los 500 caracteres.");
        }
        return limpio;
    }

    private EstadoPublicacionDiseno parsearEstado(String estado) {
        if (estado == null || estado.isBlank()) {
            return null;
        }
        try {
            return EstadoPublicacionDiseno.valueOf(estado.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Estado de publicación no válido: " + estado);
        }
    }

    private DisenoAdminResponse convertir(Diseno diseno) {

        return DisenoAdminResponse.builder()
                .id(diseno.getId())
                .titulo(diseno.getTitulo())
                .imagenUrl(diseno.getImagenUrl())
                .prompt(diseno.getPrompt())
                .productoId(diseno.getProducto() != null ? diseno.getProducto().getId() : null)
                .producto(diseno.getProducto() != null ? diseno.getProducto().getNombre() : null)
                .usuarioId(diseno.getUsuario() != null ? diseno.getUsuario().getId() : null)
                .usuarioNombre(diseno.getUsuario() != null ? diseno.getUsuario().getNombre() : null)
                .origen(diseno.getOrigen() != null ? diseno.getOrigen().name() : null)
                .estadoPublicacion(diseno.getEstadoPublicacion() != null
                        ? diseno.getEstadoPublicacion().name().toLowerCase() : null)
                .motivoRechazo(diseno.getMotivoRechazo())
                .meGusta(disenoMeGustaRepository.countByDisenoId(diseno.getId()))
                .vecesUsado(diseno.getVecesUsado() == null ? 0 : diseno.getVecesUsado())
                .usado(Boolean.TRUE.equals(diseno.getUsado()))
                .publicadoEn(diseno.getPublicadoEn())
                .createdAt(diseno.getCreatedAt())
                .build();
    }
}
