package com.skd.sublimacion_api.service.impl;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;

import com.skd.sublimacion_api.dto.envio.EnvioResponse;
import com.skd.sublimacion_api.entity.Direccion;
import com.skd.sublimacion_api.entity.TarifaEnvio;
import com.skd.sublimacion_api.exeption.ForbiddenException;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.DireccionRepository;
import com.skd.sublimacion_api.repository.TarifaEnvioRepository;
import com.skd.sublimacion_api.service.EnvioService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EnvioServiceImpl implements EnvioService {

    // Si el departamento no tiene tarifa configurada (o la dirección no lo
    // declara), se aplica un valor razonable en vez de fallar.
    private static final BigDecimal COSTO_POR_DEFECTO = BigDecimal.valueOf(12000);
    private static final int DIAS_POR_DEFECTO = 5;

    private final DireccionRepository direccionRepository;
    private final TarifaEnvioRepository tarifaEnvioRepository;

    @Override
    public EnvioResponse calcular(Long direccionId, Long usuarioId) {

        Direccion direccion = direccionRepository.findById(direccionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Dirección no encontrada con id: " + direccionId));

        if (!direccion.getUsuario().getId().equals(usuarioId)) {
            throw new ForbiddenException(
                    "La dirección no pertenece al usuario autenticado");
        }

        CostoEnvio costoEnvio = calcularParaCheckout(direccion);

        return EnvioResponse.builder()
                .departamento(direccion.getDepartamento())
                .costoEnvio(costoEnvio.costo())
                .diasEstimados(costoEnvio.diasEstimados())
                .tarifaConfigurada(costoEnvio.tarifaConfigurada())
                .build();
    }

    @Override
    public CostoEnvio calcularParaCheckout(Direccion direccion) {

        String departamento = direccion == null
                ? null
                : direccion.getDepartamento();

        if (departamento == null || departamento.isBlank()) {
            return new CostoEnvio(
                    COSTO_POR_DEFECTO, DIAS_POR_DEFECTO, false);
        }

        TarifaEnvio tarifa = tarifaEnvioRepository
                .findByDepartamentoIgnoreCase(departamento.trim())
                .orElse(null);

        if (tarifa == null) {
            return new CostoEnvio(
                    COSTO_POR_DEFECTO, DIAS_POR_DEFECTO, false);
        }

        return new CostoEnvio(
                tarifa.getCostoBase(),
                tarifa.getDiasEstimados(),
                true);
    }
}