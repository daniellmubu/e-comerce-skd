package com.skd.sublimacion_api.dto.favorito;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FavoritoListaResponse {

    private List<FavoritoResponse> contenido;

    private int pagina;

    private int tamanio;

    private long total;

    private int totalPaginas;
}