package com.skd.sublimacion_api.repository;

import java.util.Optional;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.skd.sublimacion_api.entity.Favorito;

public interface FavoritoRepository extends JpaRepository<Favorito, Long> {

    boolean existsByUsuario_IdAndProducto_Id(Long usuarioId, Long productoId);

    Optional<Favorito> findByUsuario_IdAndProducto_Id(Long usuarioId, Long productoId);

    void deleteByUsuario_IdAndProducto_Id(Long usuarioId, Long productoId);

    @Query("SELECT f FROM Favorito f JOIN f.producto p " +
            "WHERE f.usuario.id = :usuarioId AND p.activo = true")
    Page<Favorito> findByUsuario_IdActivos(
            @Param("usuarioId") Long usuarioId,
            Pageable pageable);

    @Query("SELECT f.producto.id FROM Favorito f " +
            "WHERE f.usuario.id = :usuarioId")
    Set<Long> findProductoIdsByUsuarioId(
            @Param("usuarioId") Long usuarioId);
}