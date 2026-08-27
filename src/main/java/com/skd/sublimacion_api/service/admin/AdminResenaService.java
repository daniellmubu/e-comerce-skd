package com.skd.sublimacion_api.service.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.skd.sublimacion_api.dto.resena.ResenaResponse;

public interface AdminResenaService {

    Page<ResenaResponse> listar(String estado, Pageable pageable);

    ResenaResponse obtenerPorId(Long id);

    ResenaResponse aprobar(Long id);

    ResenaResponse rechazar(Long id);

    void eliminar(Long id);
}
