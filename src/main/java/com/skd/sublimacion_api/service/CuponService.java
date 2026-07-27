package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.cupon.CuponRequest;
import com.skd.sublimacion_api.dto.cupon.CuponResponse;

import java.util.List;

public interface CuponService {

    List<CuponResponse> listar();

    CuponResponse obtenerPorId(Long id);

    CuponResponse guardar(CuponRequest request);

    void eliminar(Long id);

}