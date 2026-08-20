package com.skd.sublimacion_api.repository;

import com.skd.sublimacion_api.entity.ItemPedido;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ItemPedidoRepository extends JpaRepository<ItemPedido, Long> {

    List<ItemPedido> findByPedidoId(Long pedidoId);

    @Query("SELECT ip.producto.id, ip.producto.nombre, SUM(ip.cantidad) AS unidades, " +
           "SUM(ip.cantidad * ip.precioUnitario) AS ingreso " +
           "FROM ItemPedido ip GROUP BY ip.producto.id, ip.producto.nombre " +
           "ORDER BY SUM(ip.cantidad) DESC")
    List<Object[]> productosMasVendidos(Pageable pageable);

    @Query("SELECT ip.producto.id, ip.producto.nombre, SUM(ip.cantidad) AS unidades, " +
           "SUM(ip.cantidad * ip.precioUnitario) AS ingreso " +
           "FROM ItemPedido ip JOIN ip.pedido p JOIN Pago pag ON pag.pedido = p " +
           "WHERE pag.estado = 'aprobado' " +
           "GROUP BY ip.producto.id, ip.producto.nombre " +
           "ORDER BY SUM(ip.cantidad) DESC")
    List<Object[]> productosMasVendidosAprobados(Pageable pageable);
}