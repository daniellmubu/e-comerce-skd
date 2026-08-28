package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.diseno.DisenoRequest;
import com.skd.sublimacion_api.dto.diseno.DisenoResponse;

import java.util.List;

public interface DisenoService {
    DisenoResponse generar(DisenoRequest request, Long usuarioId);
    DisenoResponse subir(byte[] contenido, String contentType, String nombreArchivo,
                         Long productoId, Long usuarioId);
    List<DisenoResponse> listarPorUsuario(Long usuarioId);
    void eliminar(Long id, Long usuarioId);
    int eliminarTodos(Long usuarioId);
}
