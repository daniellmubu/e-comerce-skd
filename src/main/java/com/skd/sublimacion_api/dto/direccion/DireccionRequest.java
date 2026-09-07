package com.skd.sublimacion_api.dto.direccion;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DireccionRequest {

    private Long usuarioId;

    @NotBlank(message = "La calle es obligatoria")
    @Size(max = 150, message = "La calle no puede exceder 150 caracteres")
    private String calle;

    @NotBlank(message = "La ciudad es obligatoria")
    @Size(max = 80, message = "La ciudad no puede exceder 80 caracteres")
    private String ciudad;

    @NotBlank(message = "El departamento es obligatorio")
    @Size(max = 80, message = "El departamento no puede exceder 80 caracteres")
    private String departamento;

    @Size(max = 10, message = "El código postal no puede exceder 10 caracteres")
    @Pattern(regexp = "^[0-9A-Za-z\\- ]*$", message = "Código postal con formato inválido")
    private String codigoPostal;

    private Boolean predeterminada;
}