package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.ItemCarrito;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemCarritoRepository extends JpaRepository<ItemCarrito, Long> {

    List<ItemCarrito> findByCarritoId(Long carritoId);

    boolean existsByDisenoId(Long disenoId);

}