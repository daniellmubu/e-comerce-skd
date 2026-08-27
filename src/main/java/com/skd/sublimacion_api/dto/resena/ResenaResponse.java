package com.skd.sublimacion_api.dto.resena;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ResenaResponse {

    private Long id;

    private Long productoId;

    private String productoNombre;

    private Long usuarioId;

    private String usuarioNombre;

    private Integer calificacion;

    private String comentario;

    private String imagenUrl;

    private String estado;

    private LocalDateTime creadoEn;

    private Boolean compraVerificada;
}