package com.skd.sublimacion_api.service.admin;

import com.skd.sublimacion_api.dto.empaque.EmpaqueRequest;
import com.skd.sublimacion_api.dto.empaque.EmpaqueResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminEmpaqueService {

    Page<EmpaqueResponse> listar(String tipo, Pageable pageable);

    EmpaqueResponse obtenerPorId(Long id);

    EmpaqueResponse guardar(EmpaqueRequest request);

    EmpaqueResponse actualizar(Long id, EmpaqueRequest request);

    void eliminar(Long id);
}
