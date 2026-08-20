package com.skd.sublimacion_api.dto.resena;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ResenaListaResponse {

    private Double promedio;

    private Long total;

    private List<ResenaResponse> contenido;

    private int pagina;

    private int tamanio;

    private int totalPaginas;
}