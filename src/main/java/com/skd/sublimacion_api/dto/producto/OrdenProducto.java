package com.skd.sublimacion_api.dto.producto;

import lombok.Getter;

@Getter
public enum OrdenProducto {

    RELEVANCIA("relevancia"),
    PRECIO_ASC("precioAsc"),
    PRECIO_DESC("precioDesc"),
    MEJOR_CALIFICADO("mejorCalificado"),
    MAS_VENDIDO("masVendido");

    private final String valor;

    OrdenProducto(String valor) {
        this.valor = valor;
    }

    public static OrdenProducto desdeValor(String valor) {

        if (valor == null || valor.isBlank()) {
            return RELEVANCIA;
        }

        for (OrdenProducto orden : values()) {
            if (orden.valor.equalsIgnoreCase(valor)) {
                return orden;
            }
        }

        throw new IllegalArgumentException(
                "Orden inválido: " + valor + ". Valores permitidos: "
                        + "relevancia, precioAsc, precioDesc, "
                        + "mejorCalificado, masVendido");
    }
}