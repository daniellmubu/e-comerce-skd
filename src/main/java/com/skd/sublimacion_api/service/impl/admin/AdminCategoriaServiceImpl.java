package com.skd.sublimacion_api.service.impl.admin;

import com.skd.sublimacion_api.dto.categoria.CategoriaRequest;
import com.skd.sublimacion_api.dto.categoria.CategoriaResponse;
import com.skd.sublimacion_api.entity.Categoria;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.mapper.CategoriaMapper;
import com.skd.sublimacion_api.repository.CategoriaRepository;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.service.admin.AdminCategoriaService;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminCategoriaServiceImpl implements AdminCategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;
    private final CategoriaMapper categoriaMapper;

    @Override
    public Page<CategoriaResponse> listar(Pageable pageable) {

        return categoriaRepository
                .findAll(pageable)
                .map(categoriaMapper::toResponse);
    }

    @Override
    public CategoriaResponse obtenerPorId(Long id) {
        return categoriaMapper.toResponse(obtenerCategoria(id));
    }


    @Override
    public CategoriaResponse guardar(CategoriaRequest request) {

        Categoria categoriaPadre = obtenerCategoriaPadre(request.getCategoriaPadreId());

        Categoria categoria = Categoria.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .categoriaPadre(categoriaPadre)
                .build();

        Categoria guardada = categoriaRepository.save(categoria);

        return categoriaMapper.toResponse(guardada);
    }

    @Override
    public CategoriaResponse actualizar(Long id, CategoriaRequest request) {

        Categoria categoria = obtenerCategoria(id);

        Categoria categoriaPadre = obtenerCategoriaPadre(request.getCategoriaPadreId());

            // Evita que una categoría sea su propio padre
        if (categoriaPadre != null &&
           categoria.getId().equals(categoriaPadre.getId())) {

           throw new IllegalArgumentException(
                "Una categoría no puede ser su propia categoría padre.");
        }
        

        categoria.setNombre(request.getNombre());
        categoria.setDescripcion(request.getDescripcion());
        categoria.setCategoriaPadre(categoriaPadre);

        Categoria actualizada = categoriaRepository.save(categoria);

        return categoriaMapper.toResponse(actualizada);
    }

    @Override
    public void eliminar(Long id) {

        Categoria categoria = obtenerCategoria(id);

        if (categoriaRepository.existsByCategoriaPadre(categoria)) {
            throw new IllegalStateException(
                    "No se puede eliminar la categoría porque tiene subcategorías.");
        }

        if (productoRepository.existsByCategoria(categoria)) {
            throw new IllegalStateException(
                    "No se puede eliminar la categoría porque tiene productos asociados.");
        }

        categoriaRepository.delete(categoria);
    }

    private Categoria obtenerCategoria(Long id) {

        return categoriaRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Categoría no encontrada con id: " + id));
        }

    private Categoria obtenerCategoriaPadre(Long categoriaPadreId) {

        if (categoriaPadreId == null) {
                return null;
        }

        return categoriaRepository.findById(categoriaPadreId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Categoría padre no encontrada con id: "
                                        + categoriaPadreId));
        }

}