package com.skd.sublimacion_api.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.skd.sublimacion_api.entity.TarifaEnvio;

public interface TarifaEnvioRepository extends JpaRepository<TarifaEnvio, Long> {

    Optional<TarifaEnvio> findByDepartamentoIgnoreCase(String departamento);

    boolean existsByDepartamentoIgnoreCase(String departamento);

    Page<TarifaEnvio> findByDepartamentoContainingIgnoreCase(
            String departamento,
            Pageable pageable);
}