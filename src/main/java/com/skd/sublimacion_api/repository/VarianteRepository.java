package com.skd.sublimacion_api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skd.sublimacion_api.entity.Variante;

public interface VarianteRepository extends JpaRepository<Variante, Long> {

    List<Variante> findByProductoIdOrderByIdAsc(Long productoId);
}
