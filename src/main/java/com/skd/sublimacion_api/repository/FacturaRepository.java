package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.Factura;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacturaRepository extends JpaRepository<Factura,Long> {
}