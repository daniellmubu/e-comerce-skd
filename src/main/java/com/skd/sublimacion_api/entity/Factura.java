package com.skd.sublimacion_api.entity;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "factura")
@Data
@EqualsAndHashCode(of = "id")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Factura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @Column(name = "numero_factura", nullable = false, unique = true)
    private String numeroFactura;

    @Column(name = "archivo_pdf_url")
    private String archivoPdfUrl;

    @Column(name = "emitida_en")
    private LocalDateTime emitidaEn;

}