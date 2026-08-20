package com.skd.sublimacion_api.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.skd.sublimacion_api.entity.Resena;

public interface ResenaRepository extends JpaRepository<Resena, Long> {

    boolean existsByProducto_IdAndUsuario_Id(Long productoId, Long usuarioId);

    Page<Resena> findByProducto_Id(Long productoId, Pageable pageable);

    @Query("SELECT r.producto.id, AVG(r.calificacion), COUNT(r) " +
            "FROM Resena r GROUP BY r.producto.id")
    List<Object[]> promedioYConteoPorProducto();

    @Query("SELECT AVG(r.calificacion), COUNT(r) " +
            "FROM Resena r WHERE r.producto.id = :productoId")
    List<Object[]> promedioYConteoPorProductoId(
            @Param("productoId") Long productoId);
}