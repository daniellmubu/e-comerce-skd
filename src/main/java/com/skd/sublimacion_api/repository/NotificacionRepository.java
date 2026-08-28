package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    List<Notificacion> findByUsuarioIdOrderByCreadoEnDesc(Long usuarioId);

    long countByUsuarioIdAndLeidaFalse(Long usuarioId);
}