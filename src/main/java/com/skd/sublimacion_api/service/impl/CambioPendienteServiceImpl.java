package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.dto.usuario.CambioPendienteResponse;
import com.skd.sublimacion_api.dto.usuario.UsuarioRequest;
import com.skd.sublimacion_api.entity.CambioPendiente;
import com.skd.sublimacion_api.entity.EstadoCambioPendiente;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.CambioPendienteRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.service.CambioPendienteService;
import com.skd.sublimacion_api.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CambioPendienteServiceImpl implements CambioPendienteService {

    private static final long HORAS_VALIDEZ = 48L;

    private final CambioPendienteRepository cambioPendienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Override
    @Transactional
    public CambioPendienteResponse solicitarActualizacion(
            Long usuarioId,
            UsuarioRequest request) {

        Usuario usuario = buscarUsuario(usuarioId);

        validarUnicidad(request.getUsername(), request.getCorreo(), usuarioId);

        // Sólo se permite una solicitud pendiente por usuario: se invalidan las previas.
        cambioPendienteRepository.deleteByUsuario_Id(usuarioId);

        CambioPendiente pendiente = CambioPendiente.builder()
                .token(UUID.randomUUID().toString())
                .usuario(usuario)
                .nombre(request.getNombre())
                .username(request.getUsername())
                .correo(request.getCorreo())
                .telefono(request.getTelefono())
                .fechaExpiracion(LocalDateTime.now().plusHours(HORAS_VALIDEZ))
                .build();

        cambioPendienteRepository.save(pendiente);

        emailService.enviarConfirmacionCambioDatos(
                usuario.getCorreo(),
                usuario.getNombre(),
                construirResumen(request, usuario),
                pendiente.getToken(),
                baseUrl);

        return convertir(pendiente);
    }

    @Override
    @Transactional
    public String aprobar(String token) {

        CambioPendiente pendiente = obtenerYValidar(token);

        Usuario usuario = pendiente.getUsuario();

        validarUnicidad(pendiente.getUsername(), pendiente.getCorreo(), usuario.getId());

        usuario.setNombre(pendiente.getNombre());
        usuario.setUsername(pendiente.getUsername());
        usuario.setCorreo(pendiente.getCorreo());
        usuario.setTelefono(pendiente.getTelefono());

        usuarioRepository.save(usuario);

        pendiente.setEstado(EstadoCambioPendiente.APROBADO);
        pendiente.setFechaRespuesta(LocalDateTime.now());
        cambioPendienteRepository.save(pendiente);

        return "Tus datos han sido actualizados correctamente.";
    }

    @Override
    @Transactional
    public String rechazar(String token) {

        CambioPendiente pendiente = obtenerYValidar(token);

        pendiente.setEstado(EstadoCambioPendiente.RECHAZADO);
        pendiente.setFechaRespuesta(LocalDateTime.now());
        cambioPendienteRepository.save(pendiente);

        return "El cambio fue rechazado. No se modificó ningún dato de tu cuenta.";
    }

    @Override
    @Transactional(readOnly = true)
    public List<CambioPendienteResponse> listarPorUsuario(Long usuarioId) {

        return cambioPendienteRepository
                .findByUsuario_IdOrderByFechaCreacionDesc(usuarioId)
                .stream()
                .map(this::convertir)
                .toList();
    }

    private CambioPendiente obtenerYValidar(String token) {

        CambioPendiente pendiente = cambioPendienteRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException(
                        "El enlace de confirmación es inválido."));

        if (pendiente.getEstado() != EstadoCambioPendiente.PENDIENTE) {
            throw new IllegalArgumentException(
                    "Este enlace ya fue utilizado. El estado de la solicitud es: "
                            + pendiente.getEstado().name().toLowerCase());
        }
        if (pendiente.getFechaExpiracion().isBefore(LocalDateTime.now())) {
            pendiente.setEstado(EstadoCambioPendiente.EXPIRADO);
            cambioPendienteRepository.save(pendiente);
            throw new IllegalArgumentException(
                    "El enlace de confirmación ha expirado. Contacta al administrador "
                            + "para solicitar un nuevo cambio.");
        }

        return pendiente;
    }

    private Usuario buscarUsuario(Long id) {

        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuario no encontrado con id: " + id));
    }

    private void validarUnicidad(String username, String correo, Long idActual) {

        usuarioRepository.findByUsername(username)
                .ifPresent(usuario -> {
                    if (!usuario.getId().equals(idActual)) {
                        throw new IllegalArgumentException(
                                "Ya existe un usuario con ese username");
                    }
                });

        usuarioRepository.findByCorreo(correo)
                .ifPresent(usuario -> {
                    if (!usuario.getId().equals(idActual)) {
                        throw new IllegalArgumentException(
                                "Ya existe un usuario con ese correo");
                    }
                });
    }

    private String construirResumen(UsuarioRequest request, Usuario actual) {

        StringBuilder sb = new StringBuilder();
        sb.append("<ul style=\"margin:0;padding-left:18px;\">");

        if (request.getNombre() != null && !request.getNombre().equals(actual.getNombre())) {
            sb.append("<li><strong>Nombre:</strong> ").append(actual.getNombre())
                    .append(" → ").append(request.getNombre()).append("</li>");
        }
        if (request.getUsername() != null && !request.getUsername().equals(actual.getUsername())) {
            sb.append("<li><strong>Usuario:</strong> ").append(actual.getUsername())
                    .append(" → ").append(request.getUsername()).append("</li>");
        }
        if (request.getCorreo() != null && !request.getCorreo().equals(actual.getCorreo())) {
            sb.append("<li><strong>Correo:</strong> ").append(actual.getCorreo())
                    .append(" → ").append(request.getCorreo()).append("</li>");
        }
        if (request.getTelefono() != null && !request.getTelefono().equals(actual.getTelefono())) {
            sb.append("<li><strong>Teléfono:</strong> ")
                    .append(actual.getTelefono() == null ? "—" : actual.getTelefono())
                    .append(" → ").append(request.getTelefono()).append("</li>");
        }

        sb.append("</ul>");

        return sb.toString();
    }

    private CambioPendienteResponse convertir(CambioPendiente p) {

        return CambioPendienteResponse.builder()
                .id(p.getId())
                .usuarioId(p.getUsuario().getId())
                .estado(p.getEstado().name())
                .nombre(p.getNombre())
                .username(p.getUsername())
                .correo(p.getCorreo())
                .telefono(p.getTelefono())
                .fechaExpiracion(p.getFechaExpiracion())
                .fechaCreacion(p.getFechaCreacion())
                .build();
    }
}
