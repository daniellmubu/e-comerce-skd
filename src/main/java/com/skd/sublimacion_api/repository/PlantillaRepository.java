package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.Plantilla;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlantillaRepository extends JpaRepository<Plantilla, Long> {

    /**
     * Plantillas visibles en la galería del personalizador, ordenadas por
     * nombre para que el menú sea estable entre recargas. El filtrado por
     * categoría y tipo de producto se hace en el servicio: la tabla es pequeña
     * y así se evita SQL dinámico.
     */
    List<Plantilla> findByActivoTrueOrderByNombreAsc();
}
