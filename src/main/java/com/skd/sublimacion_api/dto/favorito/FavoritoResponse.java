package com.skd.sublimacion_api.dto.favorito;

import java.time.LocalDateTime;

import com.skd.sublimacion_api.dto.producto.ProductoResponse;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FavoritoResponse {

    private Long id;

    private LocalDateTime fechaAgregado;

    private String imagenUrl;

    private ProductoResponse producto;
}