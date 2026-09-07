package com.skd.sublimacion_api.dto.ventadirecta;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Marca una venta directa como cobrada ({@code cobrado = true}) o por cobrar. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CobroVentaRequest {

    @NotNull(message = "Indica si la venta está cobrada")
    private Boolean cobrado;
}
