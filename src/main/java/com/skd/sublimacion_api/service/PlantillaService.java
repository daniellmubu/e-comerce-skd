package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.plantilla.PlantillaResponse;

import java.util.List;

public interface PlantillaService {

    /**
     * Plantillas activas, opcionalmente filtradas por categoría y por tipo de
     * producto compatible ("camiseta" o "mug"; las "ambos" siempre aplican).
     */
    List<PlantillaResponse> listar(String categoria, String productoTipo);

    PlantillaResponse obtenerPorId(Long id);
}
