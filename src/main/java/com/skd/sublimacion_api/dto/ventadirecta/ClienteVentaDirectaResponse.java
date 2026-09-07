package com.skd.sublimacion_api.dto.ventadirecta;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Cliente guardado de ventas directas (para autocompletar en el registro). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClienteVentaDirectaResponse {

    private Long id;

    private String nombre;

    private String telefono;
}
