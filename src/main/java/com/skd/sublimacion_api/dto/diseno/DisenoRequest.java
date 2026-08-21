package com.skd.sublimacion_api.dto.diseno;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisenoRequest {
    private String prompt;
    private Long productoId;
    private String estilo; // "caricatura" | "minimalista" | "retro" | "lineas" | null
    private String imagenReferencia; // dataURL base64, opcional
}