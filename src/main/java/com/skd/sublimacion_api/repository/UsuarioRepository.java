package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUsername(String username);
    Optional<Usuario> findByCorreo(String correo);
    boolean existsByUsername(String username);
    boolean existsByCorreo(String correo);
}