package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.solicitud.CambiosSolicitudRequest;
import com.skd.sublimacion_api.dto.solicitud.SolicitudDisenoResponse;

import java.util.List;

public interface SolicitudDisenoService {

    SolicitudDisenoResponse crear(Long productoId, String descripcion,
                                  byte[] referencia, String contentType,
                                  String nombreArchivo, Long usuarioId);

    List<SolicitudDisenoResponse> listarMias(Long usuarioId);

    SolicitudDisenoResponse obtener(Long id, Long usuarioId);

    SolicitudDisenoResponse aprobar(Long id, Long usuarioId);

    SolicitudDisenoResponse solicitarCambios(Long id, CambiosSolicitudRequest request, Long usuarioId);
}