package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.CuentaCancelacionToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface CuentaCancelacionTokenRepository extends JpaRepository<CuentaCancelacionToken, Long> {

    Optional<CuentaCancelacionToken> findByToken(String token);

    @Modifying
    @Transactional
    void deleteByUsuario_Id(Long usuarioId);

    Optional<CuentaCancelacionToken> findTopByUsuario_IdAndUsadoTrueOrderByFechaUsoDesc(Long usuarioId);
}
