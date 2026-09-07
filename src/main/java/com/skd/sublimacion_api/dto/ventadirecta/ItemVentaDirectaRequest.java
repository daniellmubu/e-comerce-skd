package com.skd.sublimacion_api.dto.ventadirecta;

import java.math.BigDecimal;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Una línea del formulario de venta directa. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemVentaDirectaRequest {

    @NotNull(message = "Debes indicar el producto")
    private Long productoId;

    /** Id de la variante (talla/color). Obligatoria cuando el producto usa variantes. */
    private Long varianteId;

    @NotNull(message = "Debes indicar la cantidad")
    @Min(value = 1, message = "La cantidad debe ser mayor a 0")
    private Integer cantidad;

    /** Precio unitario. Si es null se toma el precio vigente del producto/variante. */
    private BigDecimal precioUnitario;
}
