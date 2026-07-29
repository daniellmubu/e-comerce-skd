package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    Optional<Producto> findByNombre(String nombre);

    List<Producto> findByActivoTrue();

    List<Producto> findByNombreContainingIgnoreCase(String nombre);

    List<Producto> findByCategoriaId(Long categoriaId);

}