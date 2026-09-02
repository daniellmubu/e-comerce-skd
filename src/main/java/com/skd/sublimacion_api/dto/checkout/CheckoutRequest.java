package com.skd.sublimacion_api.dto.checkout;

import lombok.Data;

import java.time.LocalDate;

@Data
public class CheckoutRequest {

    private Long direccionId;

    private Long empaqueId;

    private Long cuponId;

    private LocalDate fechaEntregaDeseada;

    private String metodoPago;

    private String destinatarioRegalo;

    private String ocasionRegalo;

}