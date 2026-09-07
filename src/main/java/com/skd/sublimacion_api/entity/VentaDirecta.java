package com.skd.sublimacion_api.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Venta registrada manualmente por el administrador (mostrador, WhatsApp, ferias,
 * etc.), es decir, ventas que NO pasan por la tienda online.
 *
 * <p>Al crearla se descuenta inventario (producto o variante) usando el servicio
 * único de inventario; al cancelarla se devuelve el stock. No participa en el
 * kanban de producción ni en el flujo de pedidos online.</p>
 */
@Entity
@Table(name = "venta_directa")
@Data
@EqualsAndHashCode(of = "id")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VentaDirecta {

    public static final String ESTADO_PENDIENTE = "pendiente"; // por cobrar
    public static final String ESTADO_COBRADA = "cobrada";
    public static final String ESTADO_CANCELADA = "cancelada";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Cliente persistido (permite autocompletar en futuras ventas). Puede ser null en ventas antiguas. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private ClienteVentaDirecta cliente;

    /** Nombre del cliente al momento de la venta (snapshot para mostrar sin joins). */
    @Column(name = "nombre_cliente", nullable = false, length = 160)
    private String nombreCliente;

    @Column(length = 30)
    private String telefono;

    @Column(name = "metodo_pago", nullable = false, length = 30)
    private String metodoPago;

    /** pendiente (por cobrar) | cobrada | cancelada. */
    @Builder.Default
    @Column(nullable = false, length = 20)
    private String estado = ESTADO_PENDIENTE;

    @Column(columnDefinition = "TEXT")
    private String nota;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @Column(name = "pagado_en")
    private LocalDateTime pagadoEn;

    @Column(name = "cancelado_en")
    private LocalDateTime canceladoEn;

    @PrePersist
    protected void alCrear() {
        if (creadoEn == null) {
            creadoEn = LocalDateTime.now();
        }
    }
}
