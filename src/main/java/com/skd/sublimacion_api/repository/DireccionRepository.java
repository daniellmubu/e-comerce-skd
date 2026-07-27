package com.skd.sublimacion_api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skd.sublimacion_api.entity.Direccion;

public interface DireccionRepository extends JpaRepository<Direccion, Long> {

    List<Direccion> findByUsuarioId(Long usuarioId);

}