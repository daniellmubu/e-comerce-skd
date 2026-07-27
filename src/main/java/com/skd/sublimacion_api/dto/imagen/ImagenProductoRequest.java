package com.skd.sublimacion_api.dto.imagen;

import lombok.Data;

@Data
public class ImagenProductoRequest {

    private Long productoId;

    private String url;

    private Boolean esPrincipal;

}