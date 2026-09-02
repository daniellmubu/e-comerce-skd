package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.dto.categoria.CategoriaRequest;
import com.skd.sublimacion_api.dto.categoria.CategoriaResponse;
import com.skd.sublimacion_api.entity.Categoria;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.CategoriaRepository;
import com.skd.sublimacion_api.service.CategoriaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaServiceImpl implements CategoriaService {

    private final CategoriaRepository categoriaRepository;

    @Override
    public List<CategoriaResponse> listar() {
        // Solo categorías con productos activos: el filtro del catálogo no
        // muestra categorías vacías (ej. camisetas descontinuadas).
        return categoriaRepository.findConProductosActivos()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public CategoriaResponse obtenerPorId(Long id) {

        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Categoría no encontrada con id: " + id));

        return toResponse(categoria);
    }

    @Override
    public CategoriaResponse guardar(CategoriaRequest request) {

        Categoria categoriaPadre = null;

        if (request.getCategoriaPadreId() != null) {
            categoriaPadre = categoriaRepository.findById(request.getCategoriaPadreId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Categoría padre no encontrada"));
        }

        Categoria categoria = Categoria.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .categoriaPadre(categoriaPadre)
                .build();

        return toResponse(categoriaRepository.save(categoria));
    }

    @Override
    public CategoriaResponse actualizar(Long id, CategoriaRequest request) {

        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Categoría no encontrada"));

        Categoria categoriaPadre = null;

        if (request.getCategoriaPadreId() != null) {

            categoriaPadre = categoriaRepository.findById(request.getCategoriaPadreId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Categoría padre no encontrada"));
        }

        categoria.setNombre(request.getNombre());
        categoria.setDescripcion(request.getDescripcion());
        categoria.setCategoriaPadre(categoriaPadre);

        return toResponse(categoriaRepository.save(categoria));
    }

    @Override
    public void eliminar(Long id) {

        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Categoría no encontrada"));

        categoriaRepository.delete(categoria);
    }

    private CategoriaResponse toResponse(Categoria categoria) {

        return CategoriaResponse.builder()
                .id(categoria.getId())
                .nombre(categoria.getNombre())
                .descripcion(categoria.getDescripcion())
                .categoriaPadreId(
                        categoria.getCategoriaPadre() != null
                                ? categoria.getCategoriaPadre().getId()
                                : null
                )
                .build();
    }
}