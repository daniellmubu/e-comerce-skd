package com.skd.sublimacion_api.entity;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "empaque")
@Data
@EqualsAndHashCode(of = "id")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Empaque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String tipo;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Builder.Default
    @Column(name = "costo_adicional", precision = 10, scale = 2)
    private BigDecimal costoAdicional = BigDecimal.ZERO;

    /** URL pública de la imagen que representa este tipo de empaque. */
    @Column(name = "imagen_url", columnDefinition = "TEXT")
    private String imagenUrl;

}