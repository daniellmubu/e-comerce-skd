package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.item_carrito;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemCarritoRepository extends JpaRepository<item_carrito, Long> {

    List<item_carrito> findByCarritoId(Long carritoId);

}