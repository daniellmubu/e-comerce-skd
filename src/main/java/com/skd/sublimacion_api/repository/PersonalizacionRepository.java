package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.Personalizacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PersonalizacionRepository extends JpaRepository<Personalizacion, Long> {

    Optional<Personalizacion> findByItemCarritoId(Long itemCarritoId);
}
