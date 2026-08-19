package com.skd.sublimacion_api.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.skd.sublimacion_api.entity.Pedido;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByUsuarioId(Long usuarioId);

    boolean existsByEmpaqueId(Long empaqueId);

    Page<Pedido> findByEstado(String estado, Pageable pageable);

    Page<Pedido> findByUsuarioId(Long usuarioId, Pageable pageable);

    Page<Pedido> findByEstadoAndUsuarioId(String estado, Long usuarioId, Pageable pageable);
}