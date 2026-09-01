package com.skd.sublimacion_api.dto.diseno;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Cuerpo para rechazar u ocultar un diseño público: el motivo se le muestra
 * al dueño en "Mis diseños".
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModerarDisenoRequest {
    private String motivo;
}
