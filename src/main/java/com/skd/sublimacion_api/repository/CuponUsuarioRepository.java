package com.skd.sublimacion_api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skd.sublimacion_api.entity.CuponUsuario;

public interface CuponUsuarioRepository extends JpaRepository<CuponUsuario, Long> {

    List<CuponUsuario> findByUsuario_Id(Long usuarioId);

    Optional<CuponUsuario> findByCupon_IdAndUsuario_Id(Long cuponId, Long usuarioId);

    boolean existsByCupon_IdAndUsuario_IdAndUsadoTrue(Long cuponId, Long usuarioId);
}