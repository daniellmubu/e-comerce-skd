package com.skd.sublimacion_api.service.admin;

import com.skd.sublimacion_api.dto.dashboard.ProductoMasVendidoResponse;
import com.skd.sublimacion_api.dto.dashboard.ResumenDashboardResponse;
import com.skd.sublimacion_api.dto.dashboard.VentaPeriodoResponse;

import java.util.List;

public interface AdminDashboardService {

    ResumenDashboardResponse resumen();

    List<ProductoMasVendidoResponse> productosMasVendidos(int limite);

    List<VentaPeriodoResponse> ventasPorPeriodo();
}
