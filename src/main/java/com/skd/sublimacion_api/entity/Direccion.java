package com.skd.sublimacion_api.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "direccion")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Direccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 200)
    private String calle;

    @Column(nullable = false, length = 100)
    private String ciudad;

    @Column(length = 100)
    private String departamento;

    @Column(name = "codigo_postal", length = 20)
    private String codigoPostal;

    @Builder.Default
    private Boolean predeterminada = false;
}