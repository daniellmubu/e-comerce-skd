package com.skd.sublimacion_api.dto.diseno;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisenoResponse {
    private Long id;
    private String prompt;
    private Long productoId;
    private String producto; 
    private String imagenUrl;
}