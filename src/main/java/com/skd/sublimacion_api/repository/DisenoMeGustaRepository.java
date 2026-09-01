package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.DisenoMeGusta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DisenoMeGustaRepository extends JpaRepository<DisenoMeGusta, Long> {

    boolean existsByDisenoIdAndUsuarioId(Long disenoId, Long usuarioId);

    Optional<DisenoMeGusta> findByDisenoIdAndUsuarioId(Long disenoId, Long usuarioId);

    long countByDisenoId(Long disenoId);

    boolean existsByDisenoId(Long disenoId);

    void deleteByDisenoId(Long disenoId);
}
