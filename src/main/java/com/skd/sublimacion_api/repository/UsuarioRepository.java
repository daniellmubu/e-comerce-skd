package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface UsuarioRepository extends
        JpaRepository<Usuario, Long>,
        JpaSpecificationExecutor<Usuario> {

    Optional<Usuario> findByUsername(String username);

    Optional<Usuario> findByCorreo(String correo);

    boolean existsByUsername(String username);

    boolean existsByCorreo(String correo);
}