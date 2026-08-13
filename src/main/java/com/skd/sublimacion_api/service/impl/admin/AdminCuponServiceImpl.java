package com.skd.sublimacion_api.service.impl.admin;

import com.skd.sublimacion_api.dto.cupon.CuponRequest;
import com.skd.sublimacion_api.dto.cupon.CuponResponse;
import com.skd.sublimacion_api.entity.Cupon;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.mapper.CuponMapper;
import com.skd.sublimacion_api.repository.CuponRepository;
import com.skd.sublimacion_api.service.admin.AdminCuponService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import org.springframework.data.jpa.domain.Specification;
import com.skd.sublimacion_api.specification.CuponSpecification;

@Service
@RequiredArgsConstructor
public class AdminCuponServiceImpl implements AdminCuponService {

    private final CuponRepository cuponRepository;
    private final CuponMapper cuponMapper;

    @Override
    public Page<CuponResponse> listar(
            String codigo,
            Boolean activo,
            LocalDate fechaInicio,
            LocalDate fechaFin,
            Pageable pageable) {

        Specification<Cupon> specification = Specification
                .where(CuponSpecification.codigoContiene(codigo))
                .and(CuponSpecification.activoEs(activo))
                .and(CuponSpecification.fechaInicioDesde(fechaInicio))
                .and(CuponSpecification.fechaFinHasta(fechaFin));

        return cuponRepository
                .findAll(specification, pageable)
                .map(cuponMapper::toResponse);
    }

    @Override
    public CuponResponse obtenerPorId(Long id) {

        return cuponMapper.toResponse(buscarCupon(id));
    }

    @Override
    public CuponResponse guardar(CuponRequest request) {

        validarCodigo(request.getCodigo(), null);
        validarNegocio(request, null);

        Cupon cupon = new Cupon();

        actualizarDatosCupon(cupon, request);

        cupon.setUsosActuales(0);

        Cupon guardado = cuponRepository.save(cupon);

        return cuponMapper.toResponse(guardado);

    }

    @Override
    public CuponResponse actualizar(Long id, CuponRequest request) {

        Cupon cupon = buscarCupon(id);

        validarCodigo(request.getCodigo(), id);
        validarNegocio(request, cupon);


        actualizarDatosCupon(cupon, request);

        Cupon actualizado = cuponRepository.save(cupon);

        return cuponMapper.toResponse(actualizado);
    }

    @Override
    public void eliminar(Long id) {

        Cupon cupon = buscarCupon(id);

        cuponRepository.delete(cupon);
    }

    private Cupon buscarCupon(Long id) {

        return cuponRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Cupón no encontrado con id: " + id));
    }

    private void actualizarDatosCupon(
            Cupon cupon,
            CuponRequest request) {

        cupon.setCodigo(request.getCodigo().trim().toUpperCase());
        cupon.setDescuentoPorcentaje(request.getDescuentoPorcentaje());
        cupon.setFechaInicio(request.getFechaInicio());
        cupon.setFechaFin(request.getFechaFin());
        cupon.setUsosMaximos(request.getUsosMaximos());
        cupon.setActivo(request.getActivo());
    }

    private void validarCodigo(
            String codigo,
            Long idActual) {

        cuponRepository.findByCodigo(codigo.trim().toUpperCase())
                .ifPresent(cupon -> {

                    if (idActual == null || !cupon.getId().equals(idActual)) {
                        throw new IllegalArgumentException(
                                "Ya existe un cupón con ese código.");
                    }

                });
    }

    private void validarNegocio(
            CuponRequest request,
            Cupon cupon) {

        if (request.getFechaFin().isBefore(request.getFechaInicio())) {

            throw new IllegalArgumentException(
                    "La fecha de fin no puede ser anterior a la fecha de inicio.");
        }

        if (request.getUsosMaximos() != null &&
                request.getUsosMaximos() < 0) {

            throw new IllegalArgumentException(
                    "Los usos máximos no pueden ser negativos.");
        }

        if (cupon != null &&
                request.getUsosMaximos() != null &&
                request.getUsosMaximos() < cupon.getUsosActuales()) {

            throw new IllegalArgumentException(
                    "Los usos máximos no pueden ser menores que los usos actuales.");
        }

    }

}