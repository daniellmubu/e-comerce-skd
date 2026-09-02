package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

import java.util.Optional;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    Optional<Categoria> findByNombre(String nombre);

        // Validar si una categoría tiene subcategorías
    boolean existsByCategoriaPadre(Categoria categoria);

    // Categorías que tienen al menos un producto activo (para el filtro del catálogo).
    @Query("SELECT DISTINCT p.categoria FROM Producto p WHERE p.activo = true AND p.categoria IS NOT NULL")
    List<Categoria> findConProductosActivos();

}