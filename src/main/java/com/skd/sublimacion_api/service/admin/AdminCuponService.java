package com.skd.sublimacion_api.service.admin;

import com.skd.sublimacion_api.dto.cupon.CuponRequest;
import com.skd.sublimacion_api.dto.cupon.CuponResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface AdminCuponService {

    Page<CuponResponse> listar(
            String codigo,
            Boolean activo,
            LocalDate fechaInicio,
            LocalDate fechaFin,
            Pageable pageable);

    CuponResponse obtenerPorId(Long id);

    CuponResponse guardar(CuponRequest request);

    CuponResponse actualizar(Long id, CuponRequest request);

    void eliminar(Long id);

}