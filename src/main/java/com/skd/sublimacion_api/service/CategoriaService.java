package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.categoria.CategoriaRequest;
import com.skd.sublimacion_api.dto.categoria.CategoriaResponse;

import java.util.List;

public interface CategoriaService {

    List<CategoriaResponse> listar();

    CategoriaResponse obtenerPorId(Long id);

    CategoriaResponse guardar(CategoriaRequest request);

    CategoriaResponse actualizar(Long id, CategoriaRequest request);

    void eliminar(Long id);
}