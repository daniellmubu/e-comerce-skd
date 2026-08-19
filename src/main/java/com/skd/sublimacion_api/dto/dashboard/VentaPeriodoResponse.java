package com.skd.sublimacion_api.dto.dashboard;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class VentaPeriodoResponse {

    private String periodo;

    private BigDecimal total;
}
