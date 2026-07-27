package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.dto.cupon.CuponRequest;
import com.skd.sublimacion_api.dto.cupon.CuponResponse;
import com.skd.sublimacion_api.entity.Cupon;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.CuponRepository;
import com.skd.sublimacion_api.service.CuponService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CuponServiceImpl implements CuponService {

    private final CuponRepository cuponRepository;

    @Override
    public List<CuponResponse> listar() {

        return cuponRepository.findAll()
                .stream()
                .map(this::convertir)
                .toList();
    }

    @Override
    public CuponResponse obtenerPorId(Long id) {

        Cupon cupon = cuponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cupón no encontrado"));

        return convertir(cupon);
    }

    @Override
    public CuponResponse guardar(CuponRequest request) {

        Cupon cupon = Cupon.builder()
                .codigo(request.getCodigo())
                .descuentoPorcentaje(request.getDescuentoPorcentaje())
                .fechaInicio(request.getFechaInicio())
                .fechaFin(request.getFechaFin())
                .usosMaximos(request.getUsosMaximos())
                .activo(request.getActivo() == null ? true : request.getActivo())
                .build();

        return convertir(cuponRepository.save(cupon));
    }

    @Override
    public void eliminar(Long id) {

        Cupon cupon = cuponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cupón no encontrado"));

        cuponRepository.delete(cupon);
    }

    private CuponResponse convertir(Cupon cupon){

        return CuponResponse.builder()
                .id(cupon.getId())
                .codigo(cupon.getCodigo())
                .descuentoPorcentaje(cupon.getDescuentoPorcentaje())
                .fechaInicio(cupon.getFechaInicio())
                .fechaFin(cupon.getFechaFin())
                .usosMaximos(cupon.getUsosMaximos())
                .usosActuales(cupon.getUsosActuales())
                .activo(cupon.getActivo())
                .build();
    }

}