package com.skd.sublimacion_api.dto.variante;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request del CRUD admin de variantes. Operar sobre la entidad canónica
 * {@code VarianteProducto} (la misma que usa el carrito y el endpoint público).
 */
@Data
public class VarianteRequest {

    @NotNull(message = "El producto es obligatorio")
    private Long productoId;

    @NotBlank(message = "La talla es obligatoria")
    @Size(max = 10, message = "La talla no puede superar 10 caracteres")
    private String talla;

    @NotBlank(message = "El color es obligatorio")
    @Size(max = 50, message = "El color no puede superar 50 caracteres")
    private String color;

    @NotNull(message = "El stock es obligatorio")
    @Min(value = 0, message = "El stock debe ser mayor o igual a 0")
    private Integer stock;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.0", message = "El precio debe ser mayor o igual a 0")
    private BigDecimal precio;

    @Size(max = 50, message = "El SKU no puede superar 50 caracteres")
    private String sku;
}
