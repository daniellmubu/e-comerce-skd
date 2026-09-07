package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.VarianteProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;

@Repository
public interface VarianteProductoRepository extends JpaRepository<VarianteProducto, Long> {

    List<VarianteProducto> findByProductoId(Long productoId);

    boolean existsByProductoId(Long productoId);

    /** Suma el stock de todas las variantes de un producto (0 si no tiene variantes). */
    @Query("SELECT COALESCE(SUM(v.stock), 0) FROM VarianteProducto v WHERE v.producto.id = :productoId")
    Integer sumarStockPorProducto(@Param("productoId") Long productoId);

    /** Sumas de stock agrupadas por producto para un conjunto de ids (evita N+1 en el listado). */
    @Query("SELECT v.producto.id, COALESCE(SUM(v.stock), 0) "
            + "FROM VarianteProducto v WHERE v.producto.id IN :productoIds GROUP BY v.producto.id")
    List<Object[]> sumarStockPorProductoIds(@Param("productoIds") java.util.Collection<Long> productoIds);

    @Query("SELECT v FROM VarianteProducto v WHERE v.producto.id = :productoId AND v.talla = :talla AND v.color = :color")
    Optional<VarianteProducto> findByProductoIdAndTallaAndColor(
            @Param("productoId") Long productoId,
            @Param("talla") String talla,
            @Param("color") String color);

    boolean existsByProductoIdAndTallaAndColor(
            Long productoId,
            String talla,
            String color);

    // TC-CHK-17: bloqueo pesimista para variantes
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM VarianteProducto v WHERE v.id = :id")
    Optional<VarianteProducto> findByIdForUpdate(@Param("id") Long id);

    @Modifying
    @Query("UPDATE VarianteProducto v SET v.stock = v.stock - :cantidad WHERE v.id = :id AND v.stock >= :cantidad")
    int decrementarStockAtomico(@Param("id") Long id, @Param("cantidad") int cantidad);
}