package com.skd.sublimacion_api.dto.referido;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReferidoInfoResponse {

    private String codigo;

    private String link;

    private long totalReferidos;

    private long recompensas;
}