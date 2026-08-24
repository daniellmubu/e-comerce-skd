package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.EstadoSolicitudDiseno;
import com.skd.sublimacion_api.entity.SolicitudDiseno;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SolicitudDisenoRepository extends JpaRepository<SolicitudDiseno, Long> {

    List<SolicitudDiseno> findByUsuarioIdOrderByCreadoEnDesc(Long usuarioId);

    Page<SolicitudDiseno> findByEstado(EstadoSolicitudDiseno estado, Pageable pageable);
}