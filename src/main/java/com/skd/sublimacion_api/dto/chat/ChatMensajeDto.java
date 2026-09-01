package com.skd.sublimacion_api.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMensajeDto {

    @NotBlank
    @Pattern(regexp = "user|model", message = "El rol debe ser 'user' o 'model'")
    private String rol;

    @NotBlank
    @Size(max = 1000, message = "El texto no puede superar 1000 caracteres")
    private String texto;
}
