package com.skd.sublimacion_api.service.admin;

import com.skd.sublimacion_api.dto.solicitud.SolicitudDisenoResponse;
import com.skd.sublimacion_api.entity.EstadoSolicitudDiseno;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminSolicitudDisenoService {

    Page<SolicitudDisenoResponse> listar(EstadoSolicitudDiseno estado, Pageable pageable);

    SolicitudDisenoResponse obtenerPorId(Long id);

    SolicitudDisenoResponse cambiarEstado(Long id, EstadoSolicitudDiseno estado);

    SolicitudDisenoResponse enviarPropuesta(Long id, byte[] contenido, String contentType,
                                            String nombreArchivo, String mensajeAdmin);
}