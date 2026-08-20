package com.skd.sublimacion_api.service.impl.admin;

import com.skd.sublimacion_api.dto.dashboard.ProductoMasVendidoResponse;
import com.skd.sublimacion_api.dto.estadisticas.ResumenEstadisticasResponse;
import com.skd.sublimacion_api.dto.estadisticas.VentaDiariaResponse;
import com.skd.sublimacion_api.repository.ItemPedidoRepository;
import com.skd.sublimacion_api.repository.PedidoRepository;
import com.skd.sublimacion_api.service.admin.AdminEstadisticasService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminEstadisticasServiceImpl implements AdminEstadisticasService {

    private static final int LIMITE_DEFAULT = 10;
    private static final int DIAS_DEFAULT = 30;

    private final PedidoRepository pedidoRepository;
    private final ItemPedidoRepository itemPedidoRepository;

    @Override
    public List<VentaDiariaResponse> ventasPorDia(LocalDate desde, LocalDate hasta) {

        LocalDate fin = hasta != null ? hasta : LocalDate.now();
        LocalDate inicio = desde != null ? desde : fin.minusDays(DIAS_DEFAULT - 1);

        if (inicio.isAfter(fin)) {
            throw new IllegalArgumentException("La fecha 'desde' no puede ser posterior a 'hasta'");
        }

        List<Object[]> filas = pedidoRepository.ventasPorDia(
                inicio.atStartOfDay(),
                fin.plusDays(1).atStartOfDay());

        Map<String, BigDecimal> totalesPorDia = new HashMap<>();
        for (Object[] fila : filas) {
            totalesPorDia.put((String) fila[0], (BigDecimal) fila[1]);
        }

        List<VentaDiariaResponse> resultado = new ArrayList<>();
        LocalDate dia = inicio;
        while (!dia.isAfter(fin)) {
            resultado.add(VentaDiariaResponse.builder()
                    .fecha(dia)
                    .total(totalesPorDia.getOrDefault(dia.toString(), BigDecimal.ZERO))
                    .build());
            dia = dia.plusDays(1);
        }

        return resultado;
    }

    @Override
    public List<ProductoMasVendidoResponse> productosMasVendidos(int limite) {

        int tope = limite > 0 ? limite : LIMITE_DEFAULT;

        List<Object[]> filas = itemPedidoRepository
                .productosMasVendidosAprobados(PageRequest.of(0, tope));

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
    public ResumenEstadisticasResponse resumen() {

        Object[] fila = pedidoRepository.resumenEstadisticas().get(0);

        BigDecimal ingresosTotales = (BigDecimal) fila[0];
        long totalPedidos = ((Number) fila[1]).longValue();

        BigDecimal ticketPromedio = totalPedidos > 0
                ? ingresosTotales.divide(BigDecimal.valueOf(totalPedidos), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return ResumenEstadisticasResponse.builder()
                .ingresosTotales(ingresosTotales)
                .totalPedidos(totalPedidos)
                .ticketPromedio(ticketPromedio)
                .build();
    }
}