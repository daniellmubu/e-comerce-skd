package com.skd.sublimacion_api.service.admin;

import java.util.List;

import com.skd.sublimacion_api.dto.variante.VarianteRequest;
import com.skd.sublimacion_api.dto.variante.VarianteResponse;

public interface AdminVarianteService {

    List<VarianteResponse> listarPorProducto(Long productoId);

    VarianteResponse obtenerPorId(Long id);

    VarianteResponse guardar(VarianteRequest request);

    VarianteResponse actualizar(Long id, VarianteRequest request);

    void eliminar(Long id);
}
