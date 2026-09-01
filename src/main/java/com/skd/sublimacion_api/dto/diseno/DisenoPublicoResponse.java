package com.skd.sublimacion_api.dto.diseno;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Diseño visible en la galería pública (solo los aprobados por el admin).
 * Incluye métricas de popularidad (me gusta y usos) para todo el mundo.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisenoPublicoResponse {
    private Long id;
    private String titulo;
    private String imagenUrl;
    private String prompt;
    private Long productoId;
    private String producto;
    private String usuarioNombre;
    private String origen;
    private long meGusta;
    private long vecesUsado;
    private LocalDateTime publicadoEn;
    // true si el usuario autenticado ya dio "me gusta" a este diseño.
    private Boolean meGustaPropio;
}
