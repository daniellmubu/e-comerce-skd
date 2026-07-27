package com.skd.sublimacion_api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skd.sublimacion_api.entity.Pedido;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByUsuarioId(Long usuarioId);

}