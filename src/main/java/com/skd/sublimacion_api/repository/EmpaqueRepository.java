package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.Empaque;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmpaqueRepository extends JpaRepository<Empaque, Long> {

    Optional<Empaque> findByTipo(String tipo);

    Page<Empaque> findByTipoContainingIgnoreCase(String tipo, Pageable pageable);
}