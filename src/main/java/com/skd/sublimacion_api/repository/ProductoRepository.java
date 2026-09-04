package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.Categoria;
import com.skd.sublimacion_api.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface ProductoRepository extends JpaRepository<Producto, Long>,
        JpaSpecificationExecutor<Producto> {


    // Validación para eliminar categorías
    boolean existsByCategoria(Categoria categoria);
    Optional<Producto> findByNombre(String nombre);

    long countByActivoTrue();

    List<Producto> findByActivoTrue();

    List<Producto> findByNombreContainingIgnoreCase(String nombre);

    List<Producto> findByCategoriaId(Long categoriaId);

    Page<Producto> findAll(Pageable pageable);

    // TC-CHK-17: bloqueo pesimista para checkout concurrente del último ítem
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Producto p WHERE p.id = :id")
    Optional<Producto> findByIdForUpdate(@Param("id") Long id);

    // Decremento atómico con validación stock >= cantidad (defensa adicional, evita stock negativo)
    @Modifying
    @Query("UPDATE Producto p SET p.stock = p.stock - :cantidad WHERE p.id = :id AND p.stock >= :cantidad")
    int decrementarStockAtomico(@Param("id") Long id, @Param("cantidad") int cantidad);

}