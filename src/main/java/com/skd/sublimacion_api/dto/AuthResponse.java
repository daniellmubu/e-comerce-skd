package com.skd.sublimacion_api.dto;

import com.skd.sublimacion_api.dto.cupon.CuponBienvenidaResponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String refreshToken;
    private Long id;
    private String nombre;
    private String username;
    private String correo;
    private String rol;
    private CuponBienvenidaResponse cuponBienvenida;
}