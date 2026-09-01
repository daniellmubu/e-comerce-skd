package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.diseno.DisenoPublicoResponse;
import com.skd.sublimacion_api.dto.diseno.DisenoRequest;
import com.skd.sublimacion_api.dto.diseno.DisenoResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface DisenoService {
    DisenoResponse generar(DisenoRequest request, Long usuarioId);
    DisenoResponse subir(byte[] contenido, String contentType, String nombreArchivo,
                         Long productoId, Long usuarioId);
    List<DisenoResponse> listarPorUsuario(Long usuarioId);
    void eliminar(Long id, Long usuarioId);
    int eliminarTodos(Long usuarioId);

    // ---- Publicación pública (galería de diseños de usuarios) ----

    /** Envía un diseño propio a moderación para que sea visible en la galería. */
    DisenoResponse publicar(Long disenoId, String titulo, Long usuarioId);

    /** Lista los diseños públicos aprobados, ordenables por popularidad. */
    Page<DisenoPublicoResponse> listarPublicos(String orden, Pageable pageable, Long usuarioId);

    /** Obtiene un diseño público por id (con métricas). */
    DisenoPublicoResponse obtenerPublico(Long id, Long usuarioId);

    /** Da "me gusta" a un diseño público. Devuelve true si se registró. */
    boolean darMeGusta(Long disenoId, Long usuarioId);

    /** Quita el "me gusta". Devuelve true si existía. */
    boolean quitarMeGusta(Long disenoId, Long usuarioId);

    /** ¿El usuario ya dio "me gusta" a este diseño? */
    boolean estaEnMeGusta(Long disenoId, Long usuarioId);
}
