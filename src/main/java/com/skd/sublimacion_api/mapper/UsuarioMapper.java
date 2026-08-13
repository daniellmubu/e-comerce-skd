package com.skd.sublimacion_api.mapper;

import com.skd.sublimacion_api.dto.usuario.UsuarioResponse;
import com.skd.sublimacion_api.entity.Usuario;
import org.springframework.stereotype.Component;

@Component
public class UsuarioMapper {

    public UsuarioResponse toResponse(Usuario usuario) {

        if (usuario == null) {
            return null;
        }

        return UsuarioResponse.builder()
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .username(usuario.getUsername())
                .correo(usuario.getCorreo())
                .telefono(usuario.getTelefono())
                .verificado(usuario.getVerificado())
                .bloqueado(usuario.getBloqueado())
                .rol(usuario.getRol().name())
                .build();
    }
}