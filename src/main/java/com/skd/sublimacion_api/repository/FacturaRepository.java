package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.Factura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FacturaRepository extends JpaRepository<Factura,Long> {

    Optional<Factura> findByPedidoId(Long pedidoId);

    @Query("SELECT f FROM Factura f WHERE f.pedido.id IN :pedidoIds")
    List<Factura> findByPedidoIdIn(@Param("pedidoIds") List<Long> pedidoIds);
}