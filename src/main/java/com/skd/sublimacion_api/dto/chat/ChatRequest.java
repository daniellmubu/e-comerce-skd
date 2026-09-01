package com.skd.sublimacion_api.dto.chat;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {

    @NotBlank(message = "El mensaje no puede estar vacío")
    @Size(max = 500, message = "El mensaje no puede superar 500 caracteres")
    private String mensaje;

    @Valid
    @Size(max = 20, message = "El historial no puede superar 20 mensajes")
    private List<ChatMensajeDto> historial;
}
