package com.skd.sublimacion_api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Características visibles en la ficha del producto.
 * Por ahora se sirve un listado base del negocio (la tienda no gestiona
 * características por producto en BD); devolver siempre algo evita el 500
 * que se generaba porque la ruta no existía en el backend.
 */
@RestController
@RequestMapping("/api/caracteristicas")
public class CaracteristicaController {

    @GetMapping("/producto/{productoId}")
    public List<Map<String, Object>> porProducto(@PathVariable Long productoId) {
        List<Map<String, Object>> lista = new ArrayList<>();
        String[] textos = {
                "Sublimación de alta resolución, colores vivos y duraderos",
                "Diseño 100% personalizado: lo creas tú con tu foto, texto o la IA",
                "Material resistente y apto para lavado frecuente sin perder el estampado",
                "Empaque cuidadoso y envío a todo el país",
        };
        for (int i = 0; i < textos.length; i++) {
            Map<String, Object> fila = new HashMap<>();
            fila.put("id", (long) (i + 1));
            fila.put("texto", textos[i]);
            lista.add(fila);
        }
        return lista;
    }
}
