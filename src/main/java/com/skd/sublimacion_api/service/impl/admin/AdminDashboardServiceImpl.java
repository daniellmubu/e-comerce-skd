package com.skd.sublimacion_api.service.impl.admin;

import com.skd.sublimacion_api.dto.dashboard.DashboardVentasResponse;
import com.skd.sublimacion_api.dto.dashboard.ProductoMasVendidoResponse;
import com.skd.sublimacion_api.dto.dashboard.ResumenDashboardResponse;
import com.skd.sublimacion_api.dto.dashboard.VentaPeriodoResponse;
import com.skd.sublimacion_api.repository.ItemPedidoRepository;
import com.skd.sublimacion_api.repository.PedidoRepository;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.service.admin.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private static final int LIMITE_DEFAULT = 5;

    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;
    private final PedidoRepository pedidoRepository;
    private final ItemPedidoRepository itemPedidoRepository;

    @Override
    public ResumenDashboardResponse resumen() {

        long pendientes = pedidoRepository.countByEstado("recibido")
                + pedidoRepository.countByEstado("disenando");

        return ResumenDashboardResponse.builder()
                .totalUsuarios(usuarioRepository.count())
                .totalProductos(productoRepository.countByActivoTrue())
                .totalPedidos(pedidoRepository.count())
                .ventasTotales(pedidoRepository.sumVentasTotales())
                .pedidosPendientes(pendientes)
                .pedidosCompletados(pedidoRepository.countByEstado("entregado"))
                .pedidosCancelados(pedidoRepository.countByEstado("cancelado"))
                .build();
    }

    @Override
    public List<ProductoMasVendidoResponse> productosMasVendidos(int limite) {

        int tope = limite > 0 ? limite : LIMITE_DEFAULT;

        List<Object[]> filas = itemPedidoRepository
                .productosMasVendidos(PageRequest.of(0, tope));

        List<ProductoMasVendidoResponse> resultado = new ArrayList<>();

        for (Object[] fila : filas) {
            resultado.add(ProductoMasVendidoResponse.builder()
                    .productoId((Long) fila[0])
                    .producto((String) fila[1])
                    .unidadesVendidas(((Number) fila[2]).longValue())
                    .ingresoTotal((BigDecimal) fila[3])
                    .build());
        }

        return resultado;
    }

    @Override
    public List<VentaPeriodoResponse> ventasPorPeriodo() {
        return mapearPeriodos(pedidoRepository.ventasPorPeriodo());
    }

    @Override
    public DashboardVentasResponse ventas() {

        LocalDate hoy = LocalDate.now();

        return DashboardVentasResponse.builder()
                .anual(mapearPeriodos(pedidoRepository.ventasPorAnio()))
                .mensual(mapearPeriodos(pedidoRepository.ventasPorPeriodo()))
                .semanal(mapearPeriodos(pedidoRepository.ventasPorSemana()))
                .ventasAnioActual(pedidoRepository.sumVentasDesde(hoy.withDayOfYear(1).atStartOfDay()))
                .ventasMesActual(pedidoRepository.sumVentasDesde(hoy.withDayOfMonth(1).atStartOfDay()))
                .ventasSemanaActual(pedidoRepository.sumVentasDesde(
                        hoy.with(DayOfWeek.MONDAY).atStartOfDay()))
                .build();
    }

    private List<VentaPeriodoResponse> mapearPeriodos(List<Object[]> filas) {

        List<VentaPeriodoResponse> resultado = new ArrayList<>();

        for (Object[] fila : filas) {
            resultado.add(VentaPeriodoResponse.builder()
                    .periodo((String) fila[0])
                    .total((BigDecimal) fila[1])
                    .build());
        }

        return resultado;
    }
}
