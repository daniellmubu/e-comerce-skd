package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.Cupon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CuponRepository extends JpaRepository<Cupon, Long> {

    Optional<Cupon> findByCodigo(String codigo);

}