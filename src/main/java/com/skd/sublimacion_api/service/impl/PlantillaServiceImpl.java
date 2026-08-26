package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.dto.plantilla.PlantillaResponse;
import com.skd.sublimacion_api.entity.Plantilla;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.PlantillaRepository;
import com.skd.sublimacion_api.service.PlantillaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PlantillaServiceImpl implements PlantillaService {

    // Tipo de producto que aplica a cualquier prenda del personalizador.
    private static final String TIPO_AMBOS = "ambos";

    private final PlantillaRepository plantillaRepository;

    @Override
    public List<PlantillaResponse> listar(String categoria, String productoTipo) {

        String categoriaFiltro = normalizar(categoria);
        String productoFiltro = normalizar(productoTipo);

        return plantillaRepository.findByActivoTrueOrderByNombreAsc()
                .stream()
                .filter(p -> categoriaFiltro == null
                        || p.getCategoria().equalsIgnoreCase(categoriaFiltro))
                .filter(p -> productoFiltro == null
                        || p.getProductoTipoCompatible().equalsIgnoreCase(productoFiltro)
                        || p.getProductoTipoCompatible().equalsIgnoreCase(TIPO_AMBOS))
                .map(this::toResponse)
                .toList();
    }

    @Override
    public PlantillaResponse obtenerPorId(Long id) {

        Plantilla plantilla = plantillaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Plantilla no encontrada con id: " + id));

        return toResponse(plantilla);
    }

    private String normalizar(String valor) {
        if (valor == null || valor.isBlank()) return null;
        return valor.trim();
    }

    private PlantillaResponse toResponse(Plantilla plantilla) {

        return PlantillaResponse.builder()
                .id(plantilla.getId())
                .nombre(plantilla.getNombre())
                .categoria(plantilla.getCategoria())
                .imagenUrl(plantilla.getImagenUrl())
                .productoTipoCompatible(plantilla.getProductoTipoCompatible())
                .activo(plantilla.getActivo())
                .build();
    }
}
