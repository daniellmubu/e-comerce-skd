package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.SesionActiva;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SesionActivaRepository extends JpaRepository<SesionActiva, Long> {

    Optional<SesionActiva> findByTokenJti(String tokenJti);

    List<SesionActiva> findByUsuarioIdAndRevocadaFalse(Long usuarioId);

    long countByUsuarioIdAndRevocadaFalse(Long usuarioId);

    /** Limpieza de sesiones ya vencidas. */
    void deleteByExpiraEnBefore(LocalDateTime fecha);
}
