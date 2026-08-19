package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.Categoria;
import com.skd.sublimacion_api.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ProductoRepository extends JpaRepository<Producto, Long>,
        JpaSpecificationExecutor<Producto> {


    // Validación para eliminar categorías
    boolean existsByCategoria(Categoria categoria);
    Optional<Producto> findByNombre(String nombre);

    long countByActivoTrue();

    List<Producto> findByActivoTrue();

    List<Producto> findByNombreContainingIgnoreCase(String nombre);

    List<Producto> findByCategoriaId(Long categoriaId);

    Page<Producto> findAll(Pageable pageable);

}