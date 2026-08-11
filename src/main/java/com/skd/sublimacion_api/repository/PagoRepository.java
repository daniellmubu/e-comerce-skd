package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PagoRepository extends JpaRepository<Pago,Long> {

    Optional<Pago> findByPedidoId(Long pedidoId);
}