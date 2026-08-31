package com.skd.sublimacion_api.service.admin;

import com.skd.sublimacion_api.dto.usuario.CambioPendienteResponse;
import com.skd.sublimacion_api.dto.usuario.UsuarioRequest;
import com.skd.sublimacion_api.dto.usuario.UsuarioResponse;
import com.skd.sublimacion_api.entity.Rol;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AdminUsuarioService {

    Page<UsuarioResponse> listar(
        String nombre,
        String username,
        String correo,
        Rol rol,
        Boolean bloqueado,
        Boolean verificado,
        Pageable pageable);

    UsuarioResponse obtenerPorId(Long id);

    UsuarioResponse guardar(UsuarioRequest request);

    /**
     * No modifica al usuario directamente: crea una solicitud pendiente que el
     * cliente debe aprobar desde el correo (double opt-in).
     */
    CambioPendienteResponse actualizar(Long id, UsuarioRequest request);

    void bloquear(Long id);

    void desbloquear(Long id);

    List<CambioPendienteResponse> listarCambiosPendientes(Long usuarioId);
}
