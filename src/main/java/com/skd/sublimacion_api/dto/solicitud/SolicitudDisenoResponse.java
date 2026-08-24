package com.skd.sublimacion_api.dto.solicitud;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SolicitudDisenoResponse {

    private Long id;

    private Long usuarioId;

    private String usuario;

    private Long productoId;

    private String producto;

    private String descripcion;

    private String referenciaImagenUrl;

    private String estado;

    private String propuestaImagenUrl;

    private String mensajeAdmin;

    private String motivoCambios;

    private Long disenoId;

    private String disenoImagenUrl;

    private LocalDateTime creadoEn;

    private LocalDateTime actualizadoEn;
}