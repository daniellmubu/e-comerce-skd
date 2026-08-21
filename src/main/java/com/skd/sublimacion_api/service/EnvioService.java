package com.skd.sublimacion_api.service;

import java.math.BigDecimal;

import com.skd.sublimacion_api.dto.envio.EnvioResponse;
import com.skd.sublimacion_api.entity.Direccion;

public interface EnvioService {

    EnvioResponse calcular(Long direccionId, Long usuarioId);

    CostoEnvio calcularParaCheckout(Direccion direccion);

    record CostoEnvio(
            BigDecimal costo,
            Integer diasEstimados,
            boolean tarifaConfigurada) {}
}