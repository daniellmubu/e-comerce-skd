package com.skd.sublimacion_api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ContactoRequest {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo no tiene un formato válido")
    private String correo;

    private String asunto;

    @NotBlank(message = "El mensaje es obligatorio")
    @Size(min = 10, message = "El mensaje debe tener al menos 10 caracteres")
    private String mensaje;
}