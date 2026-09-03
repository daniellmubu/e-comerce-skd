package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.RegistroCodigo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RegistroCodigoRepository extends JpaRepository<RegistroCodigo, Long> {

    Optional<RegistroCodigo> findTopByCorreoOrderByCreadoEnDesc(String correo);

    void deleteByCorreo(String correo);
}