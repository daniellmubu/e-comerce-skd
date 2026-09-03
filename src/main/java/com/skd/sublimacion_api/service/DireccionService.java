package com.skd.sublimacion_api.service;

import java.util.List;

import com.skd.sublimacion_api.dto.direccion.DireccionRequest;
import com.skd.sublimacion_api.dto.direccion.DireccionResponse;

public interface DireccionService {

    DireccionResponse obtenerPorId(Long id);

    List<DireccionResponse> listarPorUsuario(Long usuarioId);

    DireccionResponse guardar(DireccionRequest request);

    DireccionResponse actualizar(Long id, DireccionRequest request, Long usuarioId);

    void eliminar(Long id, Long usuarioId);

    void eliminar(Long id);

}