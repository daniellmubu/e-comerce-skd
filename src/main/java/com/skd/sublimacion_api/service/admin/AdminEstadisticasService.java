package com.skd.sublimacion_api.service.admin;

import com.skd.sublimacion_api.dto.dashboard.ProductoMasVendidoResponse;
import com.skd.sublimacion_api.dto.estadisticas.ResumenEstadisticasResponse;
import com.skd.sublimacion_api.dto.estadisticas.VentaDiariaResponse;

import java.time.LocalDate;
import java.util.List;

public interface AdminEstadisticasService {

    List<VentaDiariaResponse> ventasPorDia(LocalDate desde, LocalDate hasta);

    List<ProductoMasVendidoResponse> productosMasVendidos(int limite);

    ResumenEstadisticasResponse resumen();
}