package com.skd.sublimacion_api.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.skd.sublimacion_api.entity.Pedido;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByUsuarioId(Long usuarioId);

    boolean existsByEmpaqueId(Long empaqueId);

    Page<Pedido> findByEstado(String estado, Pageable pageable);

    Page<Pedido> findByUsuarioId(Long usuarioId, Pageable pageable);

    Page<Pedido> findByEstadoAndUsuarioId(String estado, Long usuarioId, Pageable pageable);

    long countByEstado(String estado);

    @Query("SELECT COALESCE(SUM(p.total), 0) FROM Pedido p WHERE p.estado <> 'cancelado'")
    BigDecimal sumVentasTotales();

    @Query("SELECT FUNCTION('to_char', p.creadoEn, 'YYYY-MM') AS periodo, SUM(p.total) AS total " +
           "FROM Pedido p WHERE p.estado <> 'cancelado' " +
           "GROUP BY FUNCTION('to_char', p.creadoEn, 'YYYY-MM') ORDER BY periodo")
    List<Object[]> ventasPorPeriodo();
}