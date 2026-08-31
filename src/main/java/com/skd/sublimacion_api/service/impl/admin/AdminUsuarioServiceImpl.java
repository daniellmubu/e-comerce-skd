package com.skd.sublimacion_api.service.impl.admin;

import com.skd.sublimacion_api.dto.usuario.CambioPendienteResponse;
import com.skd.sublimacion_api.dto.usuario.UsuarioRequest;
import com.skd.sublimacion_api.dto.usuario.UsuarioResponse;
import com.skd.sublimacion_api.mapper.UsuarioMapper;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.service.CambioPendienteService;
import com.skd.sublimacion_api.service.admin.AdminUsuarioService;
import lombok.RequiredArgsConstructor;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.entity.Rol;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;

import org.springframework.data.jpa.domain.Specification;
import com.skd.sublimacion_api.specification.UsuarioSpecification;

@Service
@RequiredArgsConstructor
public class AdminUsuarioServiceImpl implements AdminUsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioMapper usuarioMapper;
    private final PasswordEncoder passwordEncoder;
    private final CambioPendienteService cambioPendienteService;

   @Override
    public Page<UsuarioResponse> listar(
            String nombre,
            String username,
            String correo,
            Rol rol,
            Boolean bloqueado,
            Boolean verificado,
            Pageable pageable) {

        Specification<Usuario> specification = Specification
                .where(UsuarioSpecification.nombreContiene(nombre))
                .and(UsuarioSpecification.usernameContiene(username))
                .and(UsuarioSpecification.correoContiene(correo))
                .and(UsuarioSpecification.rolEs(rol))
                .and(UsuarioSpecification.bloqueadoEs(bloqueado))
                .and(UsuarioSpecification.verificadoEs(verificado));

        return usuarioRepository
                .findAll(specification, pageable)
                .map(usuarioMapper::toResponse);
    }

    @Override
    public UsuarioResponse obtenerPorId(Long id) {
        return usuarioMapper.toResponse(buscarUsuario(id));
    }

    @Override
    public UsuarioResponse guardar(UsuarioRequest request) {
        if (request.getContrasena() == null ||
            request.getContrasena().isBlank()) {

            throw new IllegalArgumentException(
                    "La contraseña es obligatoria");
}
        validarUsuario(
                request.getUsername(),
                request.getCorreo(),
                null);

        Usuario usuario = new Usuario();

        actualizarDatosUsuario(usuario, request);

        usuario.setContrasenaHash(
                passwordEncoder.encode(request.getContrasena()));

        usuario.setVerificado(false);
        usuario.setBloqueado(false);

        Usuario guardado = usuarioRepository.save(usuario);

        return usuarioMapper.toResponse(guardado);
    }

    @Override
    public CambioPendienteResponse actualizar(Long id, UsuarioRequest request) {

        // No modifica al usuario directamente: se crea una solicitud pendiente
        // que el cliente debe aprobar desde el correo (double opt-in).
        return cambioPendienteService.solicitarActualizacion(id, request);
    }

    @Override
    public void bloquear(Long id) {

        Usuario usuario = buscarUsuario(id);

        usuario.setBloqueado(true);

        usuarioRepository.save(usuario);
    }

    @Override
    public void desbloquear(Long id) {

        Usuario usuario = buscarUsuario(id);

        usuario.setBloqueado(false);

        usuarioRepository.save(usuario);
    }

    private Usuario buscarUsuario(Long id) {

        return usuarioRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Usuario no encontrado con id: " + id));
    }

    @Override
    public List<CambioPendienteResponse> listarCambiosPendientes(Long usuarioId) {

        return cambioPendienteService.listarPorUsuario(usuarioId);
    }

    private void actualizarDatosUsuario(
            Usuario usuario,
            UsuarioRequest request) {

        usuario.setNombre(request.getNombre());
        usuario.setUsername(request.getUsername());
        usuario.setCorreo(request.getCorreo());
        usuario.setTelefono(request.getTelefono());

        usuario.setRol(Rol.valueOf(request.getRol()));
    }

    private void validarUsuario(
            String username,
            String correo,
            Long idActual) {

        usuarioRepository.findByUsername(username)
                .ifPresent(usuario -> {

                    if (idActual == null || !usuario.getId().equals(idActual)) {
                        throw new IllegalArgumentException(
                                "Ya existe un usuario con ese username");
                    }

                });

        usuarioRepository.findByCorreo(correo)
                .ifPresent(usuario -> {

                    if (idActual == null || !usuario.getId().equals(idActual)) {
                        throw new IllegalArgumentException(
                                "Ya existe un usuario con ese correo");
                    }

                });
    }
}