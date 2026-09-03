package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.dto.cupon.CuponRequest;
import com.skd.sublimacion_api.dto.cupon.CuponResponse;
import com.skd.sublimacion_api.dto.cupon.CuponUsuarioResponse;
import com.skd.sublimacion_api.entity.Cupon;
import com.skd.sublimacion_api.entity.CuponUsuario;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.CuponRepository;
import com.skd.sublimacion_api.repository.CuponUsuarioRepository;
import com.skd.sublimacion_api.service.CuponService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CuponServiceImpl implements CuponService {

    private final CuponRepository cuponRepository;
    private final CuponUsuarioRepository cuponUsuarioRepository;

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
                .esUnicoPorUsuario(
                        request.getEsUnicoPorUsuario() != null
                                ? request.getEsUnicoPorUsuario()
                                : false)
                .montoMinimo(request.getMontoMinimo())
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
                .esUnicoPorUsuario(cupon.getEsUnicoPorUsuario())
                .montoMinimo(cupon.getMontoMinimo())
                .build();
    }

    @Override
    public List<CuponUsuarioResponse> listarMios(Long usuarioId) {

        return cuponUsuarioRepository.findByUsuario_Id(usuarioId)
                .stream()
                .map(this::convertirCuponUsuario)
                .toList();
    }

    private CuponUsuarioResponse convertirCuponUsuario(CuponUsuario cuponUsuario) {

        Cupon cupon = cuponUsuario.getCupon();

        return CuponUsuarioResponse.builder()
                .id(cuponUsuario.getId())
                .cuponId(cupon.getId())
                .codigo(cupon.getCodigo())
                .descuentoPorcentaje(cupon.getDescuentoPorcentaje())
                .fechaFin(cupon.getFechaFin())
                .usado(cuponUsuario.getUsado())
                .fechaUso(cuponUsuario.getFechaUso())
                .build();
    }

    @Override
    public CuponResponse validarPorCodigo(String codigo, Long usuarioId, java.math.BigDecimal subtotalCarrito) {
        Cupon cupon = cuponRepository.findByCodigo(codigo.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Cupón no válido: código inexistente"));

        if (!Boolean.TRUE.equals(cupon.getActivo())) {
            throw new IllegalArgumentException("Cupón no válido: no está activo");
        }
        java.time.LocalDate hoy = java.time.LocalDate.now();
        if (hoy.isBefore(cupon.getFechaInicio()) || hoy.isAfter(cupon.getFechaFin())) {
            throw new IllegalArgumentException("Cupón expirado: no está vigente");
        }
        if (cupon.getUsosMaximos() != null && cupon.getUsosActuales() != null && cupon.getUsosActuales() >= cupon.getUsosMaximos()) {
            throw new IllegalArgumentException("Cupón alcanzó límite de usos");
        }
        if (Boolean.TRUE.equals(cupon.getEsUnicoPorUsuario()) && cuponUsuarioRepository.existsByCupon_IdAndUsuario_IdAndUsadoTrue(cupon.getId(), usuarioId)) {
            throw new IllegalArgumentException("Cupón ya usado por tu cuenta");
        }
        if (cupon.getMontoMinimo() != null && subtotalCarrito != null && subtotalCarrito.compareTo(cupon.getMontoMinimo()) < 0) {
            throw new IllegalArgumentException("Monto mínimo requerido: $" + cupon.getMontoMinimo().toPlainString());
        }
        return convertir(cupon);
    }

}