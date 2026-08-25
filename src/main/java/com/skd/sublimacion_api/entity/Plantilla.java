package com.skd.sublimacion_api.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Plantilla de diseño prediseñada para el personalizador: el usuario parte de
 * un gráfico ya hecho en vez de empezar en blanco.
 *
 * productoTipoCompatible indica a qué productos aplica:
 * "camiseta", "mug" o "ambos". La creación/gestión se hace por ahora
 * directamente en base de datos (no hay panel de administración).
 */
@Entity
@Table(name = "plantilla")
@Data
@EqualsAndHashCode(of = "id")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Plantilla {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    // Agrupador del menú del personalizador (ej: "Fechas especiales",
    // "Frases", "Deportes", "Animales"). Texto libre para poder agregar
    // categorías nuevas sin migraciones.
    @Column(nullable = false)
    private String categoria;

    @Column(name = "imagen_url", nullable = false, columnDefinition = "TEXT")
    private String imagenUrl;

    // camiseta | mug | ambos
    @Column(name = "producto_tipo_compatible", nullable = false)
    private String productoTipoCompatible;

    // Inactiva = no aparece en la galería sin borrarla (útil para retirar
    // plantillas temporales como las de una temporada).
    @Column(nullable = false)
    private Boolean activo = true;
}
