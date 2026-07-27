package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PagoRepository extends JpaRepository<Pago,Long> {
}