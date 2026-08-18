package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.dto.pago.IniciarPagoWompiResponse;
import com.skd.sublimacion_api.dto.pago.PagoRequest;
import com.skd.sublimacion_api.dto.pago.PagoResponse;
import com.skd.sublimacion_api.dto.pago.SimulacionPagoResponse;
import com.skd.sublimacion_api.dto.pago.SimularTarjetaRequest;

import java.util.List;

public interface PagoService {

    List<PagoResponse> listar();

    PagoResponse obtenerPorId(Long id);

    PagoResponse guardar(PagoRequest request);

    SimulacionPagoResponse simularTarjeta(Long pagoId, SimularTarjetaRequest request, Long usuarioId);

    IniciarPagoWompiResponse iniciarPagoWompi(Long pagoId, Long usuarioId);

    SimulacionPagoResponse consultarEstadoPago(Long pagoId, Long usuarioId);

    void eliminar(Long id);

}