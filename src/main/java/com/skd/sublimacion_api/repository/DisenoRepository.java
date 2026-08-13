package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.Diseno;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface DisenoRepository extends JpaRepository<Diseno, Long> {
    List<Diseno> findByUsuarioId(Long usuarioId);

    long countByUsuarioIdAndCreatedAtAfter(Long usuarioId, LocalDateTime desde);
}