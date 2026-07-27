package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.ImagenProducto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ImagenProductoRepository extends JpaRepository<ImagenProducto, Long> {

    List<ImagenProducto> findByProductoId(Long productoId);

}