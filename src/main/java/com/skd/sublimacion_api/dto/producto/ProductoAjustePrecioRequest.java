package com.skd.sublimacion_api.dto.producto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductoAjustePrecioRequest {

    @NotEmpty(message = "Debe seleccionar al menos un producto")
    private List<Long> ids;

    @NotNull(message = "El porcentaje es obligatorio")
    @DecimalMin(value = "-100.0", message = "El porcentaje no puede ser menor a -100")
    private BigDecimal porcentaje;
}
