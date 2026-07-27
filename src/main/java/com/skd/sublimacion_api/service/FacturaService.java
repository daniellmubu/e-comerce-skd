package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.factura.FacturaRequest;
import com.skd.sublimacion_api.dto.factura.FacturaResponse;

import java.util.List;

public interface FacturaService {

    List<FacturaResponse> listar();

    FacturaResponse obtenerPorId(Long id);

    FacturaResponse guardar(FacturaRequest request);

    void eliminar(Long id);

}
