package com.skd.sublimacion_api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skd.sublimacion_api.entity.ClienteVentaDirecta;

public interface ClienteVentaDirectaRepository extends JpaRepository<ClienteVentaDirecta, Long> {

    /** Clientes que coinciden por nombre o teléfono (para autocompletar en el registro). */
    List<ClienteVentaDirecta> findTop20ByNombreContainingIgnoreCaseOrTelefonoContainingIgnoreCaseOrderByNombreAsc(
            String nombre, String telefono);

    /** Dedupe: primer cliente con el mismo nombre (ignorando mayúsculas). */
    Optional<ClienteVentaDirecta> findFirstByNombreIgnoreCase(String nombre);
}
