package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.diseno.DisenoRequest;
import com.skd.sublimacion_api.dto.diseno.DisenoResponse;

import java.util.List;

public interface DisenoService {
    DisenoResponse generar(DisenoRequest request, Long usuarioId);
    List<DisenoResponse> listarPorUsuario(Long usuarioId);
}
