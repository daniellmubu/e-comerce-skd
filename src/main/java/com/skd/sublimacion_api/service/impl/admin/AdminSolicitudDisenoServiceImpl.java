package com.skd.sublimacion_api.service.impl.admin;

import com.skd.sublimacion_api.dto.solicitud.SolicitudDisenoResponse;
import com.skd.sublimacion_api.entity.EstadoSolicitudDiseno;
import com.skd.sublimacion_api.entity.SolicitudDiseno;
import com.skd.sublimacion_api.exeption.BadRequestException;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.SolicitudDisenoRepository;
import com.skd.sublimacion_api.service.EmailService;
import com.skd.sublimacion_api.service.NotificacionService;
import com.skd.sublimacion_api.service.SupabaseStorageService;
import com.skd.sublimacion_api.service.WebSocketService;
import com.skd.sublimacion_api.service.admin.AdminSolicitudDisenoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminSolicitudDisenoServiceImpl implements AdminSolicitudDisenoService {

    private static final long MAX_TAMANO_IMAGEN = 5L * 1024 * 1024;

    private final SolicitudDisenoRepository solicitudDisenoRepository;
    private final SupabaseStorageService supabaseStorageService;
    private final WebSocketService webSocketService;
    private final NotificacionService notificacionService;
    private final EmailService emailService;

    @Override
    public Page<SolicitudDisenoResponse> listar(EstadoSolicitudDiseno estado, Pageable pageable) {

        Page<SolicitudDiseno> pagina = (estado == null)
                ? solicitudDisenoRepository.findAll(pageable)
                : solicitudDisenoRepository.findByEstado(estado, pageable);

        return pagina.map(this::convertir);
    }

    @Override
    public SolicitudDisenoResponse obtenerPorId(Long id) {
        return convertir(obtenerSolicitud(id));
    }

    @Override
    @Transactional
    public SolicitudDisenoResponse cambiarEstado(Long id, EstadoSolicitudDiseno estado) {

        SolicitudDiseno solicitud = obtenerSolicitud(id);

        if (estado == EstadoSolicitudDiseno.EN_DISENO) {
            boolean permitido = solicitud.getEstado() == EstadoSolicitudDiseno.RECIBIDA
                    || solicitud.getEstado() == EstadoSolicitudDiseno.CAMBIOS_SOLICITADOS;
            if (!permitido) {
                throw new BadRequestException(
                        "Solo puedes pasar a EN_DISENO desde RECIBIDA o CAMBIOS_SOLICITADOS.");
            }
        } else {
            throw new BadRequestException(
                    "Desde el panel solo puedes mover la solicitud a EN_DISENO.");
        }

        solicitud.setEstado(estado);

        SolicitudDisenoResponse response = convertir(solicitudDisenoRepository.save(solicitud));
        webSocketService.publicarEstadoSolicitud(response.getId(), response.getEstado());
        return response;
    }

    @Override
    @Transactional
    public SolicitudDisenoResponse enviarPropuesta(Long id, byte[] contenido, String contentType,
                                                   String nombreArchivo, String mensajeAdmin) {

        SolicitudDiseno solicitud = obtenerSolicitud(id);

        if (solicitud.getEstado() != EstadoSolicitudDiseno.EN_DISENO) {
            throw new BadRequestException(
                    "Solo puedes enviar una propuesta cuando la solicitud está EN_DISENO.");
        }

        if (contenido == null || contenido.length == 0) {
            throw new BadRequestException("Debes subir la imagen de la propuesta.");
        }

        if (contenido.length > MAX_TAMANO_IMAGEN) {
            throw new BadRequestException(
                    "La imagen supera el tamaño máximo permitido (5 MB).");
        }

        ExtensionImagen ext = validarTipoImagen(contentType, nombreArchivo);

        String imagenUrl = supabaseStorageService.subirImagen(
                contenido, ext.extension(), ext.contentType());

        solicitud.setPropuestaImagenUrl(imagenUrl);
        solicitud.setMensajeAdmin(mensajeAdmin == null ? null : mensajeAdmin.trim());
        solicitud.setEstado(EstadoSolicitudDiseno.PROPUESTA_ENVIADA);

        SolicitudDisenoResponse response = convertir(solicitudDisenoRepository.save(solicitud));
        webSocketService.publicarEstadoSolicitud(response.getId(), response.getEstado());

        notificarCliente(solicitud);
        return response;
    }

    private void notificarCliente(SolicitudDiseno solicitud) {

        Long usuarioId = solicitud.getUsuario().getId();
        String mensaje = "El diseñador envió una propuesta para tu solicitud #"
                + solicitud.getId() + " (" + solicitud.getProducto().getNombre() + ")."
                + " Revísala y aprueba o pide cambios.";

        notificacionService.crear(
                usuarioId, "PROPUESTA_ENVIADA", "Nueva propuesta de diseño", mensaje);

        emailService.enviarNotificacion(
                solicitud.getUsuario().getCorreo(),
                solicitud.getUsuario().getNombre(),
                "Nueva propuesta de diseño",
                mensaje);
    }

    private SolicitudDiseno obtenerSolicitud(Long id) {
        return solicitudDisenoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Solicitud de diseño no encontrada con id: " + id));
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