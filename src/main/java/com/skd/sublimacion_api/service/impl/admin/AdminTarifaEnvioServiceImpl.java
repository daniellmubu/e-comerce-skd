package com.skd.sublimacion_api.service.impl.admin;

import com.skd.sublimacion_api.dto.tarifa.TarifaEnvioRequest;
import com.skd.sublimacion_api.dto.tarifa.TarifaEnvioResponse;
import com.skd.sublimacion_api.entity.TarifaEnvio;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.TarifaEnvioRepository;
import com.skd.sublimacion_api.service.admin.AdminTarifaEnvioService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AdminTarifaEnvioServiceImpl implements AdminTarifaEnvioService {

    private final TarifaEnvioRepository tarifaEnvioRepository;

    @Override
    public Page<TarifaEnvioResponse> listar(
            String departamento,
            Pageable pageable) {

        if (departamento == null || departamento.isBlank()) {
            return tarifaEnvioRepository.findAll(pageable).map(this::convertir);
        }

        return tarifaEnvioRepository
                .findByDepartamentoContainingIgnoreCase(
                        departamento.trim(), pageable)
                .map(this::convertir);
    }

    @Override
    public TarifaEnvioResponse obtenerPorId(Long id) {
        return convertir(obtenerTarifa(id));
    }

    @Override
    @Transactional
    public TarifaEnvioResponse guardar(TarifaEnvioRequest request) {

        validarDepartamento(request.getDepartamento(), null);

        TarifaEnvio tarifa = TarifaEnvio.builder()
                .departamento(request.getDepartamento().trim())
                .costoBase(request.getCostoBase() == null
                        ? BigDecimal.ZERO
                        : request.getCostoBase())
                .diasEstimados(request.getDiasEstimados())
                .build();

        return convertir(tarifaEnvioRepository.save(tarifa));
    }

    @Override
    @Transactional
    public TarifaEnvioResponse actualizar(
            Long id,
            TarifaEnvioRequest request) {

        TarifaEnvio tarifa = obtenerTarifa(id);
        validarDepartamento(request.getDepartamento(), tarifa);

        tarifa.setDepartamento(request.getDepartamento().trim());
        tarifa.setCostoBase(request.getCostoBase() == null
                ? BigDecimal.ZERO
                : request.getCostoBase());
        tarifa.setDiasEstimados(request.getDiasEstimados());

        return convertir(tarifaEnvioRepository.save(tarifa));
    }

    @Override
    @Transactional
    public void eliminar(Long id) {

        TarifaEnvio tarifa = obtenerTarifa(id);

        tarifaEnvioRepository.delete(tarifa);
    }

    private TarifaEnvio obtenerTarifa(Long id) {

        return tarifaEnvioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tarifa de envío no encontrada con id: " + id));
    }

    private void validarDepartamento(
            String departamento,
            TarifaEnvio actual) {

        if (departamento == null || departamento.isBlank()) {
            throw new IllegalArgumentException(
                    "El departamento es obligatorio");
        }

        tarifaEnvioRepository.findByDepartamentoIgnoreCase(
                        departamento.trim())
                .filter(tarifa -> actual == null
                        || !tarifa.getId().equals(actual.getId()))
                .ifPresent(tarifa -> {
                    throw new IllegalArgumentException(
                            "Ya existe una tarifa para el departamento: "
                                    + departamento.trim());
                });
    }

    private TarifaEnvioResponse convertir(TarifaEnvio tarifa) {

        return TarifaEnvioResponse.builder()
                .id(tarifa.getId())
                .departamento(tarifa.getDepartamento())
                .costoBase(tarifa.getCostoBase())
                .diasEstimados(tarifa.getDiasEstimados())
                .build();
    }
}