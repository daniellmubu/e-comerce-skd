package com.skd.sublimacion_api.dto.imagen;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ImagenProductoResponse {

    private Long id;

    private String url;

    private Boolean esPrincipal;

    private Long productoId;

}