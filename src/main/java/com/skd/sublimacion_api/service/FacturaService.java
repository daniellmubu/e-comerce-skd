package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.factura.FacturaRequest;
import com.skd.sublimacion_api.dto.factura.FacturaResponse;

public interface FacturaService {

    FacturaResponse obtenerPorId(Long id);

    FacturaResponse guardar(FacturaRequest request);

    void eliminar(Long id);

}
