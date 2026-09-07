package com.skd.sublimacion_api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skd.sublimacion_api.entity.ItemVentaDirecta;

public interface ItemVentaDirectaRepository extends JpaRepository<ItemVentaDirecta, Long> {

    List<ItemVentaDirecta> findByVentaId(Long ventaId);
}
