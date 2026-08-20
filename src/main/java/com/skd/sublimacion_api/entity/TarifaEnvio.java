package com.skd.sublimacion_api.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tarifa_envio")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TarifaEnvio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String departamento;

    @Column(name = "costo_base", nullable = false, precision = 10, scale = 2)
    private BigDecimal costoBase;

    @Column(name = "dias_estimados", nullable = false)
    private Integer diasEstimados;
}