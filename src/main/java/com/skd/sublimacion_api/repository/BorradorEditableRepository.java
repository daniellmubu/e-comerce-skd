package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.BorradorEditable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BorradorEditableRepository extends JpaRepository<BorradorEditable, Long> {

    List<BorradorEditable> findByUsuarioIdOrderByCreadoEnDesc(Long usuarioId);

    Optional<BorradorEditable> findByIdAndUsuarioId(Long id, Long usuarioId);
}
