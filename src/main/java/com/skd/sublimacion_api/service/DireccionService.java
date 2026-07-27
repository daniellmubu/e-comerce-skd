package com.skd.sublimacion_api.service;

import java.util.List;

import com.skd.sublimacion_api.dto.direccion.DireccionRequest;
import com.skd.sublimacion_api.dto.direccion.DireccionResponse;

public interface DireccionService {

    List<DireccionResponse> listar();

    DireccionResponse obtenerPorId(Long id);

    List<DireccionResponse> listarPorUsuario(Long usuarioId);

    DireccionResponse guardar(DireccionRequest request);

    void eliminar(Long id);

}