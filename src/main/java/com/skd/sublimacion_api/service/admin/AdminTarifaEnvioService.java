package com.skd.sublimacion_api.service.admin;

import com.skd.sublimacion_api.dto.tarifa.TarifaEnvioRequest;
import com.skd.sublimacion_api.dto.tarifa.TarifaEnvioResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminTarifaEnvioService {

    Page<TarifaEnvioResponse> listar(String departamento, Pageable pageable);

    TarifaEnvioResponse obtenerPorId(Long id);

    TarifaEnvioResponse guardar(TarifaEnvioRequest request);

    TarifaEnvioResponse actualizar(Long id, TarifaEnvioRequest request);

    void eliminar(Long id);
}