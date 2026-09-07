package com.skd.sublimacion_api.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.skd.sublimacion_api.dto.ventadirecta.ClienteVentaDirectaResponse;
import com.skd.sublimacion_api.dto.ventadirecta.VentaDirectaRequest;
import com.skd.sublimacion_api.dto.ventadirecta.VentaDirectaResponse;

/** Gestión de ventas directas registradas manualmente por el administrador. */
public interface VentaDirectaService {

    Page<VentaDirectaResponse> listar(String estado, String q, Pageable pageable);

    VentaDirectaResponse obtenerPorId(Long id);

    /** Clientes guardados que coinciden por nombre o teléfono (autocompletado). */
    List<ClienteVentaDirectaResponse> listarClientes(String q);

    /** Crea la venta y descuenta el inventario (producto o variante). */
    VentaDirectaResponse crear(VentaDirectaRequest request);

    /** Marca la venta como cobrada ({@code cobrado=true}) o por cobrar. No toca stock. */
    VentaDirectaResponse cambiarCobro(Long id, Boolean cobrado);

    /** Cancela la venta y devuelve el stock reservado. */
    VentaDirectaResponse cancelar(Long id);

    /** Reactiva una venta cancelada volviendo a reservar el stock (si hay disponibilidad). */
    VentaDirectaResponse reactivar(Long id);
}
