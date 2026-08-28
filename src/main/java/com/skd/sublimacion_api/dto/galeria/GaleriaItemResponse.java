package com.skd.sublimacion_api.dto.galeria;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GaleriaItemResponse {

    private Long id;

    private String imagenUrl;

    private String comentario;

    private Integer calificacion;

    private String productoNombre;

    private Long productoId;

    private String usuarioNombre;

    private LocalDateTime creadoEn;
}