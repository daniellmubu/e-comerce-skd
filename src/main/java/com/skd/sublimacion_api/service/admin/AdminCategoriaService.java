package com.skd.sublimacion_api.service.admin;

import com.skd.sublimacion_api.dto.categoria.CategoriaRequest;
import com.skd.sublimacion_api.dto.categoria.CategoriaResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminCategoriaService {

    Page<CategoriaResponse> listar(Pageable pageable);

    CategoriaResponse obtenerPorId(Long id);

    CategoriaResponse guardar(CategoriaRequest request);

    CategoriaResponse actualizar(Long id, CategoriaRequest request);

    void eliminar(Long id);
}