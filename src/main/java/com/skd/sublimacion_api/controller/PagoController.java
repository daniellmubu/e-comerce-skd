package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.pago.PagoRequest;
import com.skd.sublimacion_api.dto.pago.PagoResponse;
import com.skd.sublimacion_api.service.PagoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pagos")
@RequiredArgsConstructor
public class PagoController {

    private final PagoService pagoService;

    @GetMapping
    public List<PagoResponse> listar() {
        return pagoService.listar();
    }

    @GetMapping("/{id}")
    public PagoResponse obtener(@PathVariable Long id) {
        return pagoService.obtenerPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PagoResponse guardar(@RequestBody PagoRequest request) {
        return pagoService.guardar(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        pagoService.eliminar(id);
    }
}