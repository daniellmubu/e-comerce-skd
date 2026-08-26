package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.plantilla.PlantillaResponse;
import com.skd.sublimacion_api.service.PlantillaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Lectura pública de plantillas prediseñadas para la galería del
 * personalizador. La creación/gestión se hace directo en base de datos, así
 * que por ahora solo existen los endpoints GET (cualquier escritura se
 * agregaría aquí como /api/admin/plantillas).
 */
@RestController
@RequestMapping("/api/plantillas")
@RequiredArgsConstructor
public class PlantillaController {

    private final PlantillaService plantillaService;

    /**
     * Lista plantillas activas con filtros opcionales:
     *   GET /api/plantillas
     *   GET /api/plantillas?categoria=Deportes
     *   GET /api/plantillas?categoria=Frases&productoTipo=mug
     */
    @GetMapping
    public List<PlantillaResponse> listar(
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String productoTipo) {

        return plantillaService.listar(categoria, productoTipo);
    }

    @GetMapping("/{id}")
    public PlantillaResponse obtenerPorId(@PathVariable Long id) {
        return plantillaService.obtenerPorId(id);
    }
}
