package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.empaque.EmpaqueRequest;
import com.skd.sublimacion_api.dto.empaque.EmpaqueResponse;

import java.util.List;

public interface EmpaqueService {

    List<EmpaqueResponse> listar();

    EmpaqueResponse obtenerPorId(Long id);

    EmpaqueResponse guardar(EmpaqueRequest request);

    void eliminar(Long id);

}