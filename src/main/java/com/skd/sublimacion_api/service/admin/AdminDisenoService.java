package com.skd.sublimacion_api.service.admin;

import com.skd.sublimacion_api.dto.diseno.DisenoAdminResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

/**
 * Moderación de los diseños que los usuarios publican en la galería pública:
 * aprobar, rechazar, ocultar y consultar métricas de popularidad.
 */
public interface AdminDisenoService {

    Page<DisenoAdminResponse> listar(String estado, String busqueda, Pageable pageable);

    DisenoAdminResponse obtenerPorId(Long id);

    /** Conteos por estado de publicación (pendiente, publicado, rechazado, oculto). */
    Map<String, Long> resumen();

    DisenoAdminResponse aprobar(Long id);

    DisenoAdminResponse rechazar(Long id, String motivo);

    DisenoAdminResponse ocultar(Long id, String motivo);

    /** Los diseños publicados con más "me gusta". */
    List<DisenoAdminResponse> topMeGusta(int limite);

    /** Los diseños publicados más utilizados en pedidos. */
    List<DisenoAdminResponse> topUsos(int limite);

    void eliminar(Long id);
}
