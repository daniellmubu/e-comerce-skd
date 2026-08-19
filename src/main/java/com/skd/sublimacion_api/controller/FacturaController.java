package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.factura.FacturaRequest;
import com.skd.sublimacion_api.dto.factura.FacturaResponse;
import com.skd.sublimacion_api.service.FacturaPdfService;
import com.skd.sublimacion_api.service.FacturaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/facturas")
@RequiredArgsConstructor
public class FacturaController {

    private final FacturaService facturaService;
    private final FacturaPdfService facturaPdfService;

    @GetMapping("/{id}")
    public FacturaResponse obtener(@PathVariable Long id) {
        return facturaService.obtenerPorId(id);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable Long id) {

        FacturaResponse factura = facturaService.obtenerPorId(id);
        byte[] pdf = facturaPdfService.generarPdf(id);

        String nombreArchivo = factura.getNumeroFactura() + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(nombreArchivo).build().toString())
                .body(pdf);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FacturaResponse guardar(@RequestBody FacturaRequest request) {
        return facturaService.guardar(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        facturaService.eliminar(id);
    }

}