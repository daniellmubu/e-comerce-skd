package com.skd.sublimacion_api.service.impl;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;

import com.skd.sublimacion_api.dto.empaque.EmpaqueRequest;
import com.skd.sublimacion_api.dto.empaque.EmpaqueResponse;
import com.skd.sublimacion_api.entity.Empaque;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.EmpaqueRepository;
import com.skd.sublimacion_api.service.EmpaqueService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmpaqueServiceImpl implements EmpaqueService {

    private final EmpaqueRepository empaqueRepository;

    @Override
    public List<EmpaqueResponse> listar() {

        return empaqueRepository.findAll()
                .stream()
                .map(this::convertir)
                .toList();
    }

    @Override
    public EmpaqueResponse obtenerPorId(Long id) {

        Empaque empaque = empaqueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empaque no encontrado"));

        return convertir(empaque);
    }

    @Override
    public EmpaqueResponse guardar(EmpaqueRequest request) {

        Empaque empaque = Empaque.builder()
                .tipo(request.getTipo())
                .descripcion(request.getDescripcion())
                .costoAdicional(
                        request.getCostoAdicional() == null
                                ? BigDecimal.ZERO
                                : request.getCostoAdicional())
                .build();

        return convertir(empaqueRepository.save(empaque));
    }

    @Override
    public void eliminar(Long id) {

        Empaque empaque = empaqueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Empaque no encontrado"));

        empaqueRepository.delete(empaque);
    }

    private EmpaqueResponse convertir(Empaque empaque){

        return EmpaqueResponse.builder()
                .id(empaque.getId())
                .tipo(empaque.getTipo())
                .descripcion(empaque.getDescripcion())
                .costoAdicional(empaque.getCostoAdicional())
                .build();
    }
}