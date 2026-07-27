package com.skd.sublimacion_api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "empaque")
@Data
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

}