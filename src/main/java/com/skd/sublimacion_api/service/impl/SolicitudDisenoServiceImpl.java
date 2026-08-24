package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.dto.solicitud.CambiosSolicitudRequest;
import com.skd.sublimacion_api.dto.solicitud.SolicitudDisenoResponse;
import com.skd.sublimacion_api.entity.Diseno;
import com.skd.sublimacion_api.entity.EstadoSolicitudDiseno;
import com.skd.sublimacion_api.entity.OrigenDiseno;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.entity.SolicitudDiseno;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.exeption.BadRequestException;
import com.skd.sublimacion_api.exeption.ForbiddenException;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.DisenoRepository;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.repository.SolicitudDisenoRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.service.SolicitudDisenoService;
import com.skd.sublimacion_api.service.SupabaseStorageService;
import com.skd.sublimacion_api.service.WebSocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SolicitudDisenoServiceImpl implements SolicitudDisenoService {

    private static final long MAX_TAMANO_IMAGEN = 5L * 1024 * 1024;

    private final SolicitudDisenoRepository solicitudDisenoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;
    private final DisenoRepository disenoRepository;
    private final SupabaseStorageService supabaseStorageService;
    private final WebSocketService webSocketService;

    @Override
    @Transactional
    public SolicitudDisenoResponse crear(Long productoId, String descripcion,
                                         byte[] referencia, String contentType,
                                         String nombreArchivo, Long usuarioId) {

        if (productoId == null) {
            throw new BadRequestException("El producto es obligatorio.");
        }
        if (descripcion == null || descripcion.isBlank()) {
            throw new BadRequestException("La descripción es obligatoria.");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));

        String referenciaUrl = null;
        if (referencia != null && referencia.length > 0) {
            if (referencia.length > MAX_TAMANO_IMAGEN) {
                throw new BadRequestException(
                        "La imagen supera el tamaño máximo permitido (5 MB).");
            }
            ExtensionImagen ext = validarTipoImagen(contentType, nombreArchivo);
            referenciaUrl = supabaseStorageService.subirImagen(
                    referencia, ext.extension(), ext.contentType());
        }

        SolicitudDiseno solicitud = SolicitudDiseno.builder()
                .usuario(usuario)
                .producto(producto)
                .descripcion(descripcion.trim())
                .referenciaImagenUrl(referenciaUrl)
                .estado(EstadoSolicitudDiseno.RECIBIDA)
                .build();

        SolicitudDisenoResponse response = convertir(solicitudDisenoRepository.save(solicitud));
        webSocketService.publicarEstadoSolicitud(response.getId(), response.getEstado());
        return response;
    }

    @Override
    public List<SolicitudDisenoResponse> listarMias(Long usuarioId) {

        return solicitudDisenoRepository.findByUsuarioIdOrderByCreadoEnDesc(usuarioId)
                .stream()
                .map(this::convertir)
                .toList();
    }

    @Override
    public SolicitudDisenoResponse obtener(Long id, Long usuarioId) {

        SolicitudDiseno solicitud = obtenerSolicitud(id);
        verificarPropietario(solicitud, usuarioId);
        return convertir(solicitud);
    }

    @Override
    @Transactional
    public SolicitudDisenoResponse aprobar(Long id, Long usuarioId) {

        SolicitudDiseno solicitud = obtenerSolicitud(id);
        verificarPropietario(solicitud, usuarioId);

        if (solicitud.getEstado() != EstadoSolicitudDiseno.PROPUESTA_ENVIADA) {
            throw new BadRequestException(
                    "Solo puedes aprobar una propuesta en estado PROPUESTA_ENVIADA.");
        }

        if (solicitud.getPropuestaImagenUrl() == null || solicitud.getPropuestaImagenUrl().isBlank()) {
            throw new BadRequestException("Aún no hay una propuesta para aprobar.");
        }

        Diseno diseno = Diseno.builder()
                .usuario(solicitud.getUsuario())
                .producto(solicitud.getProducto())
                .imagenUrl(solicitud.getPropuestaImagenUrl())
                .origen(OrigenDiseno.CONTACTO_EMPRESA)
                .build();
        diseno = disenoRepository.save(diseno);

        solicitud.setDiseno(diseno);
        solicitud.setEstado(EstadoSolicitudDiseno.LISTA_PARA_PRODUCCION);

        SolicitudDisenoResponse response = convertir(solicitudDisenoRepository.save(solicitud));
        webSocketService.publicarEstadoSolicitud(response.getId(), response.getEstado());
        return response;
    }

    @Override
    @Transactional
    public SolicitudDisenoResponse solicitarCambios(Long id, CambiosSolicitudRequest request, Long usuarioId) {

        SolicitudDiseno solicitud = obtenerSolicitud(id);
        verificarPropietario(solicitud, usuarioId);

        if (solicitud.getEstado() != EstadoSolicitudDiseno.PROPUESTA_ENVIADA) {
            throw new BadRequestException(
                    "Solo puedes pedir cambios sobre una propuesta enviada.");
        }

        solicitud.setMotivoCambios(request.getMotivo().trim());
        solicitud.setEstado(EstadoSolicitudDiseno.CAMBIOS_SOLICITADOS);

        SolicitudDisenoResponse response = convertir(solicitudDisenoRepository.save(solicitud));
        webSocketService.publicarEstadoSolicitud(response.getId(), response.getEstado());
        return response;
    }

    private SolicitudDiseno obtenerSolicitud(Long id) {
        return solicitudDisenoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Solicitud de diseño no encontrada con id: " + id));
    }

    private void verificarPropietario(SolicitudDiseno solicitud, Long usuarioId) {
        if (!solicitud.getUsuario().getId().equals(usuarioId)) {
            throw new ForbiddenException("La solicitud no pertenece al usuario autenticado.");
        }
    }

    private record ExtensionImagen(String extension, String contentType) {}

    private ExtensionImagen validarTipoImagen(String contentType, String nombreArchivo) {

        String tipo = contentType == null ? "" : contentType.toLowerCase();
        String extension;
        String tipoFinal;

        switch (tipo) {
            case "image/png" -> { extension = ".png"; tipoFinal = "image/png"; }
            case "image/jpeg", "image/jpg" -> { extension = ".jpg"; tipoFinal = "image/jpeg"; }
            case "image/webp" -> { extension = ".webp"; tipoFinal = "image/webp"; }
            default -> {
                String nombre = nombreArchivo == null ? "" : nombreArchivo.toLowerCase();
                if (nombre.endsWith(".png")) {
                    extension = ".png"; tipoFinal = "image/png";
                } else if (nombre.endsWith(".jpg") || nombre.endsWith(".jpeg")) {
                    extension = ".jpg"; tipoFinal = "image/jpeg";
                } else if (nombre.endsWith(".webp")) {
                    extension = ".webp"; tipoFinal = "image/webp";
                } else {
                    throw new BadRequestException(
                            "El archivo debe ser una imagen PNG, JPG o WEBP.");
                }
            }
        }

        return new ExtensionImagen(extension, tipoFinal);
    }

    private SolicitudDisenoResponse convertir(SolicitudDiseno solicitud) {
        return SolicitudDisenoResponse.builder()
                .id(solicitud.getId())
                .usuarioId(solicitud.getUsuario().getId())
                .usuario(solicitud.getUsuario().getNombre())
                .productoId(solicitud.getProducto().getId())
                .producto(solicitud.getProducto().getNombre())
                .descripcion(solicitud.getDescripcion())
                .referenciaImagenUrl(solicitud.getReferenciaImagenUrl())
                .estado(solicitud.getEstado().name())
                .propuestaImagenUrl(solicitud.getPropuestaImagenUrl())
                .mensajeAdmin(solicitud.getMensajeAdmin())
                .motivoCambios(solicitud.getMotivoCambios())
                .disenoId(solicitud.getDiseno() != null ? solicitud.getDiseno().getId() : null)
                .disenoImagenUrl(solicitud.getDiseno() != null ? solicitud.getDiseno().getImagenUrl() : null)
                .creadoEn(solicitud.getCreadoEn())
                .actualizadoEn(solicitud.getActualizadoEn())
                .build();
    }
}