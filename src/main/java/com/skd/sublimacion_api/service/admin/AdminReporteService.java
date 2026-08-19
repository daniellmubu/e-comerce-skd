package com.skd.sublimacion_api.service.admin;

public interface AdminReporteService {

    /**
     * Genera el reporte indicado en formato CSV (abre en Excel).
     * Tipos validos: ventas, pedidos, usuarios, productos.
     */
    byte[] exportarCsv(String tipo);

    /**
     * Genera el reporte indicado en formato PDF.
     * Tipos validos: ventas, pedidos, usuarios, productos.
     */
    byte[] exportarPdf(String tipo);
}
