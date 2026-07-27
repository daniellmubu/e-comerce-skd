package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.factura.FacturaRequest;
import com.skd.sublimacion_api.dto.factura.FacturaResponse;
import com.skd.sublimacion_api.service.FacturaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/facturas")
@RequiredArgsConstructor
public class FacturaController {

    private final FacturaService facturaService;

    @GetMapping
    public List<FacturaResponse> listar() {
        return facturaService.listar();
    }

    @GetMapping("/{id}")
    public FacturaResponse obtener(@PathVariable Long id) {
        return facturaService.obtenerPorId(id);
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