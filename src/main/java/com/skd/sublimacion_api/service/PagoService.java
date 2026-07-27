package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.pago.PagoRequest;
import com.skd.sublimacion_api.dto.pago.PagoResponse;

import java.util.List;

public interface PagoService {

    List<PagoResponse> listar();

    PagoResponse obtenerPorId(Long id);

    PagoResponse guardar(PagoRequest request);

    void eliminar(Long id);

}