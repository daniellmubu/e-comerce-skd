package com.skd.sublimacion_api.dto.diseno;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Detalle de un diseño enviado a moderación, visto desde el panel admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisenoAdminResponse {
    private Long id;
    private String titulo;
    private String imagenUrl;
    private String prompt;
    private Long productoId;
    private String producto;
    private Long usuarioId;
    private String usuarioNombre;
    private String origen;
    private String estadoPublicacion;
    private String motivoRechazo;
    private long meGusta;
    private long vecesUsado;
    private boolean usado;
    private LocalDateTime publicadoEn;
    private LocalDateTime createdAt;
}
