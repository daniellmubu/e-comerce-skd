package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.Cupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface CuponRepository extends
        JpaRepository<Cupon, Long>,
        JpaSpecificationExecutor<Cupon> {

    Optional<Cupon> findByCodigo(String codigo);

    boolean existsByCodigo(String codigo);

}