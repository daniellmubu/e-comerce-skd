package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.CambioPendiente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CambioPendienteRepository extends JpaRepository<CambioPendiente, Long> {

    Optional<CambioPendiente> findByToken(String token);

    void deleteByUsuario_Id(Long usuarioId);

    List<CambioPendiente> findByUsuario_IdOrderByFechaCreacionDesc(Long usuarioId);
}
