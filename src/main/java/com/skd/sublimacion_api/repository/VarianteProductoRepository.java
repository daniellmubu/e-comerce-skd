package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.VarianteProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VarianteProductoRepository extends JpaRepository<VarianteProducto, Long> {

    List<VarianteProducto> findByProductoId(Long productoId);

    @Query("SELECT v FROM VarianteProducto v WHERE v.producto.id = :productoId AND v.talla = :talla AND v.color = :color")
    Optional<VarianteProducto> findByProductoIdAndTallaAndColor(
            @Param("productoId") Long productoId,
            @Param("talla") String talla,
            @Param("color") String color);

    boolean existsByProductoIdAndTallaAndColor(
            Long productoId,
            String talla,
            String color);
}