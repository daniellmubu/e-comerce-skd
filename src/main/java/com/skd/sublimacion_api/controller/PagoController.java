package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.pago.IniciarPagoWompiResponse;
import com.skd.sublimacion_api.dto.pago.PagoRequest;
import com.skd.sublimacion_api.dto.pago.PagoResponse;
import com.skd.sublimacion_api.dto.pago.SimulacionPagoResponse;
import com.skd.sublimacion_api.dto.pago.SimularTarjetaRequest;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.service.PagoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pagos")
@RequiredArgsConstructor
public class PagoController {

    private final PagoService pagoService;

    @GetMapping("/{id}")
    public PagoResponse obtener(@PathVariable Long id) {
        return pagoService.obtenerPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PagoResponse guardar(@RequestBody PagoRequest request) {
        return pagoService.guardar(request);
    }

    @PostMapping("/{id}/simular-tarjeta")
    public SimulacionPagoResponse simularTarjeta(@PathVariable Long id,
                                                 @Valid @RequestBody SimularTarjetaRequest request,
                                                 @AuthenticationPrincipal Usuario usuario) {
        return pagoService.simularTarjeta(id, request, usuario.getId());
    }

    @PostMapping("/{id}/wompi")
    public IniciarPagoWompiResponse iniciarPagoWompi(@PathVariable Long id,
                                                     @AuthenticationPrincipal Usuario usuario) {
        return pagoService.iniciarPagoWompi(id, usuario.getId());
    }

    @GetMapping("/{id}/estado")
    public SimulacionPagoResponse consultarEstadoPago(@PathVariable Long id,
                                                      @AuthenticationPrincipal Usuario usuario) {
        return pagoService.consultarEstadoPago(id, usuario.getId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        pagoService.eliminar(id);
    }
}