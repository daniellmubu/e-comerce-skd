package com.skd.sublimacion_api.service.impl;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.skd.sublimacion_api.entity.Direccion;
import com.skd.sublimacion_api.entity.Factura;
import com.skd.sublimacion_api.entity.ItemPedido;
import com.skd.sublimacion_api.entity.Pago;
import com.skd.sublimacion_api.entity.Pedido;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.FacturaRepository;
import com.skd.sublimacion_api.repository.ItemPedidoRepository;
import com.skd.sublimacion_api.repository.PagoRepository;
import com.skd.sublimacion_api.service.FacturaPdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FacturaPdfServiceImpl implements FacturaPdfService {

    private final FacturaRepository facturaRepository;
    private final ItemPedidoRepository itemPedidoRepository;
    private final PagoRepository pagoRepository;

    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Override
    public byte[] generarPdf(Long facturaId) {

        Factura factura = facturaRepository.findById(facturaId)
                .orElseThrow(() -> new ResourceNotFoundException("Factura no encontrada"));

        Pedido pedido = factura.getPedido();
        Usuario usuario = pedido.getUsuario();
        Direccion direccion = pedido.getDireccion();
        List<ItemPedido> items = itemPedidoRepository.findByPedidoId(pedido.getId());
        Pago pago = pagoRepository.findByPedidoId(pedido.getId()).orElse(null);

        try {
            ByteArrayOutputStream salida = new ByteArrayOutputStream();
            Document documento = new Document(PageSize.A4, 40, 40, 50, 40);
            PdfWriter.getInstance(documento, salida);
            documento.open();

            Font fuenteTitulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, new Color(30, 30, 30));
            Font fuenteSubtitulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font fuenteNormal = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font fuenteNegrita = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);

            Paragraph titulo = new Paragraph("SKD - Sublimación de Sueños", fuenteTitulo);
            titulo.setAlignment(Element.ALIGN_CENTER);
            documento.add(titulo);

            Paragraph subtitulo = new Paragraph("Factura Electrónica de Venta", fuenteSubtitulo);
            subtitulo.setAlignment(Element.ALIGN_CENTER);
            subtitulo.setSpacingAfter(20);
            documento.add(subtitulo);

            documento.add(new Paragraph("Número de factura: " + factura.getNumeroFactura(), fuenteNegrita));
            documento.add(new Paragraph("Fecha de emisión: " + factura.getEmitidaEn().format(FORMATO_FECHA), fuenteNormal));
            documento.add(new Paragraph("Pedido N°: " + pedido.getId(), fuenteNormal));
            documento.add(new Paragraph("Estado del pedido: " + pedido.getEstado(), fuenteNormal));
            documento.add(new Paragraph(" "));

            documento.add(new Paragraph("Datos del cliente", fuenteSubtitulo));
            documento.add(new Paragraph("Nombre: " + usuario.getNombre(), fuenteNormal));
            documento.add(new Paragraph("Correo: " + usuario.getCorreo(), fuenteNormal));
            if (usuario.getTelefono() != null) {
                documento.add(new Paragraph("Teléfono: " + usuario.getTelefono(), fuenteNormal));
            }
            if (direccion != null) {
                documento.add(new Paragraph("Dirección de envío: " + direccion.getCalle() + ", "
                        + direccion.getCiudad() + ", " + direccion.getDepartamento(), fuenteNormal));
            }
            documento.add(new Paragraph(" "));

            PdfPTable tabla = new PdfPTable(4);
            tabla.setWidthPercentage(100);
            tabla.setWidths(new float[]{4, 1, 2, 2});

            agregarCeldaEncabezado(tabla, "Producto", fuenteNegrita);
            agregarCeldaEncabezado(tabla, "Cant.", fuenteNegrita);
            agregarCeldaEncabezado(tabla, "Precio Unit.", fuenteNegrita);
            agregarCeldaEncabezado(tabla, "Subtotal", fuenteNegrita);

            for (ItemPedido item : items) {
                BigDecimal subtotalItem = item.getPrecioUnitario().multiply(BigDecimal.valueOf(item.getCantidad()));

                tabla.addCell(new PdfPCell(new Paragraph(item.getProducto().getNombre(), fuenteNormal)));
                tabla.addCell(new PdfPCell(new Paragraph(String.valueOf(item.getCantidad()), fuenteNormal)));
                tabla.addCell(new PdfPCell(new Paragraph(formatearMoneda(item.getPrecioUnitario()), fuenteNormal)));
                tabla.addCell(new PdfPCell(new Paragraph(formatearMoneda(subtotalItem), fuenteNormal)));
            }

            documento.add(tabla);
            documento.add(new Paragraph(" "));

            Paragraph subtotalP = new Paragraph("Subtotal: " + formatearMoneda(pedido.getSubtotal()), fuenteNormal);
            subtotalP.setAlignment(Element.ALIGN_RIGHT);
            documento.add(subtotalP);

            Paragraph descuentoP = new Paragraph("Descuento: -" + formatearMoneda(pedido.getDescuento()), fuenteNormal);
            descuentoP.setAlignment(Element.ALIGN_RIGHT);
            documento.add(descuentoP);

            Paragraph envioP = new Paragraph("Costo de envío: " + formatearMoneda(pedido.getCostoEnvio()), fuenteNormal);
            envioP.setAlignment(Element.ALIGN_RIGHT);
            documento.add(envioP);

            Font fuenteTotal = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13);
            Paragraph totalP = new Paragraph("TOTAL: " + formatearMoneda(pedido.getTotal()), fuenteTotal);
            totalP.setAlignment(Element.ALIGN_RIGHT);
            totalP.setSpacingBefore(8);
            documento.add(totalP);

            if (pago != null) {
                documento.add(new Paragraph(" "));
                documento.add(new Paragraph("Método de pago: " + pago.getMetodo(), fuenteNormal));
                documento.add(new Paragraph("Estado del pago: " + pago.getEstado(), fuenteNormal));
            }

            Paragraph pie = new Paragraph("Gracias por tu compra en SKD.", fuenteNormal);
            pie.setAlignment(Element.ALIGN_CENTER);
            pie.setSpacingBefore(30);
            documento.add(pie);

            documento.close();

            return salida.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error al generar el PDF de la factura", e);
        }
    }

    private void agregarCeldaEncabezado(PdfPTable tabla, String texto, Font fuente) {
        PdfPCell celda = new PdfPCell(new Paragraph(texto, fuente));
        celda.setBackgroundColor(new Color(230, 230, 230));
        celda.setPadding(6);
        tabla.addCell(celda);
    }

    private String formatearMoneda(BigDecimal valor) {
        if (valor == null) {
            valor = BigDecimal.ZERO;
        }
        return "$" + String.format("%,.2f", valor);
    }
}