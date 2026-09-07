package com.skd.sublimacion_api.dto.checkout;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CheckoutRequest {

    @NotNull(message = "La dirección de envío es obligatoria")
    private Long direccionId;

    @NotNull(message = "El tipo de empaque es obligatorio")
    private Long empaqueId;

    private Long cuponId;

    @Future(message = "La fecha de entrega deseada no puede ser anterior a hoy")
    private LocalDate fechaEntregaDeseada;

    @NotBlank(message = "El método de pago es obligatorio")
    @Size(max = 20, message = "Método de pago no válido")
    private String metodoPago;

    @Size(max = 60, message = "El nombre del destinatario no puede exceder 60 caracteres")
    private String destinatarioRegalo;

    @Size(max = 30, message = "La ocasión no puede exceder 30 caracteres")
    private String ocasionRegalo;

}