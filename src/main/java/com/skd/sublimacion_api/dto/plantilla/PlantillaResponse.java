package com.skd.sublimacion_api.dto.plantilla;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlantillaResponse {

    private Long id;

    private String nombre;

    private String categoria;

    private String imagenUrl;

    // camiseta | mug | ambos
    private String productoTipoCompatible;

    private Boolean activo;
}
