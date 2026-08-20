package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.favorito.FavoritoListaResponse;
import com.skd.sublimacion_api.dto.favorito.FavoritoResponse;
import org.springframework.data.domain.Pageable;

public interface FavoritoService {

    FavoritoAgregado agregar(Long productoId, Long usuarioId);

    void eliminar(Long productoId, Long usuarioId);

    FavoritoListaResponse listarMios(Long usuarioId, Pageable pageable);

    record FavoritoAgregado(FavoritoResponse favorito, boolean creado) {}
}