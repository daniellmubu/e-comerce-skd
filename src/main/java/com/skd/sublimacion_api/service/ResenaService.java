package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.resena.ResenaListaResponse;
import com.skd.sublimacion_api.dto.resena.ResenaRequest;
import com.skd.sublimacion_api.dto.resena.ResenaResponse;
import org.springframework.data.domain.Pageable;

public interface ResenaService {

    ResenaResponse crear(ResenaRequest request, Long usuarioId);

    ResenaListaResponse listarPorProducto(Long productoId, Pageable pageable);
}