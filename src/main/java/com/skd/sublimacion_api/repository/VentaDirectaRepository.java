package com.skd.sublimacion_api.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.skd.sublimacion_api.entity.VentaDirecta;

public interface VentaDirectaRepository extends JpaRepository<VentaDirecta, Long> {

    /**
     * Lista ventas directas filtrando por estado (opcional) y por texto libre sobre
     * el cliente (nombre o teléfono). Si {@code q} viene vacío se usa {@code "%"}.
     */
    @Query("SELECT v FROM VentaDirecta v WHERE "
            + "(:estado IS NULL OR v.estado = :estado) AND "
            + "(LOWER(v.nombreCliente) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(COALESCE(v.telefono, '')) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<VentaDirecta> buscar(
            @Param("estado") String estado,
            @Param("q") String q,
            Pageable pageable);
}
