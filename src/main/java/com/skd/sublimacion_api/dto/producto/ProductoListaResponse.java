package com.skd.sublimacion_api.dto.producto;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProductoListaResponse {

    private List<ProductoResponse> contenido;

    private int pagina;

    private int tamanio;

    private long total;

    private int totalPaginas;
}