package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    Optional<Categoria> findByNombre(String nombre);

        // Validar si una categoría tiene subcategorías
    boolean existsByCategoriaPadre(Categoria categoria);

}