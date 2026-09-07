package com.skd.sublimacion_api.service.impl;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Rectangle;
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
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class FacturaPdfServiceImpl implements FacturaPdfService {

    private final FacturaRepository facturaRepository;
    private final ItemPedidoRepository itemPedidoRepository;
    private final PagoRepository pagoRepository;

    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter FORMATO_FECHA_CORTA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // Paleta SKD - coincide con frontend (indigo-600, violet-600, cyan-500, slate)
    private static final Color BRAND_INDIGO = new Color(79, 70, 229); // #4F46E5 indigo-600
    private static final Color BRAND_VIOLET = new Color(124, 58, 237); // #7C3AED violet-600
    private static final Color BRAND_CYAN = new Color(6, 182, 212); // #06B6D4 cyan-500
    private static final Color SLATE_900 = new Color(15, 23, 42);
    private static final Color SLATE_700 = new Color(51, 65, 85);
    private static final Color SLATE_500 = new Color(100, 116, 139);
    private static final Color SLATE_400 = new Color(148, 163, 184);
    private static final Color SLATE_100 = new Color(248, 250, 252); // bg gray-50
    private static final Color SLATE_200 = new Color(226, 232, 240);
    private static final Color SLATE_50 = new Color(249, 250, 251);
    private static final Color EMERALD = new Color(16, 185, 129);
    private static final Color AMBER = new Color(245, 158, 11);
    private static final Color WHITE = Color.WHITE;

    @Override
    @Transactional(readOnly = true)
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
            Document documento = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(documento, salida);
            documento.open();

            // ---- HEADER BANNER con gradiente simulado (indigo sólido) ----
            PdfPTable header = new PdfPTable(2);
            header.setWidthPercentage(100);
            header.setWidths(new float[]{1.2f, 1f});

            PdfPCell brandCell = new PdfPCell();
            brandCell.setBackgroundColor(BRAND_INDIGO);
            brandCell.setBorder(Rectangle.NO_BORDER);
            brandCell.setPadding(18);
            brandCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            Paragraph brandTitle = new Paragraph();
            brandTitle.add(new Paragraph("SKD", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 26, WHITE)));
            Paragraph brandSub = new Paragraph("Creando Sueños", FontFactory.getFont(FontFactory.HELVETICA, 11, WHITE));
            brandSub.setSpacingBefore(2);
            Paragraph brandTag = new Paragraph("Sublimación personalizada  •  Colombia", FontFactory.getFont(FontFactory.HELVETICA, 7, new Color(224, 231, 255)));
            brandTag.setSpacingBefore(4);
            brandCell.addElement(brandTitle);
            brandCell.addElement(brandSub);
            brandCell.addElement(brandTag);
            header.addCell(brandCell);

            PdfPCell facturaCell = new PdfPCell();
            facturaCell.setBackgroundColor(BRAND_INDIGO);
            facturaCell.setBorder(Rectangle.NO_BORDER);
            facturaCell.setPadding(18);
            facturaCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            facturaCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

            Font fFacturaLabel = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new Color(199, 210, 254));
            Font fFacturaNum = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, WHITE);
            Font fFacturaMeta = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(224, 231, 255));

            Paragraph pLabel = new Paragraph("FACTURA ELECTRÓNICA", fFacturaLabel);
            pLabel.setAlignment(Element.ALIGN_RIGHT);
            Paragraph pNum = new Paragraph(factura.getNumeroFactura(), fFacturaNum);
            pNum.setAlignment(Element.ALIGN_RIGHT);
            pNum.setSpacingBefore(4);
            Paragraph pFecha = new Paragraph("Emitida: " + factura.getEmitidaEn().format(FORMATO_FECHA), fFacturaMeta);
            pFecha.setAlignment(Element.ALIGN_RIGHT);
            pFecha.setSpacingBefore(6);
            Paragraph pPedido = new Paragraph("Pedido #" + pedido.getId() + "  •  " + formatearEstado(pedido.getEstado()), fFacturaMeta);
            pPedido.setAlignment(Element.ALIGN_RIGHT);

            facturaCell.addElement(pLabel);
            facturaCell.addElement(pNum);
            facturaCell.addElement(pFecha);
            facturaCell.addElement(pPedido);
            header.addCell(facturaCell);

            documento.add(header);
            documento.add(new Paragraph(" ", FontFactory.getFont(FontFactory.HELVETICA, 6)));

            // ---- BADGE ESTADO PEDIDO ----
            PdfPTable badgeTable = new PdfPTable(1);
            badgeTable.setWidthPercentage(100);
            PdfPCell badgeCell = new PdfPCell(new Paragraph("Estado: " + formatearEstado(pedido.getEstado()).toUpperCase(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, badgeColor(pedido.getEstado()))));
            badgeCell.setBackgroundColor(badgeBg(pedido.getEstado()));
            badgeCell.setBorder(Rectangle.NO_BORDER);
            badgeCell.setPadding(6);
            badgeCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            badgeCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            badgeTable.addCell(badgeCell);
            documento.add(badgeTable);

            documento.add(new Paragraph(" ", FontFactory.getFont(FontFactory.HELVETICA, 8)));

            // ---- INFO CLIENTE + RESUMEN PEDIDO en 2 columnas tipo cards ----
            PdfPTable info = new PdfPTable(2);
            info.setWidthPercentage(100);
            info.setWidths(new float[]{1f, 1f});
            info.setSpacingBefore(4);

            // Card Cliente
            PdfPCell cardCliente = crearCard();
            cardCliente.addElement(new Paragraph("Facturado a", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, BRAND_INDIGO)));
            cardCliente.addElement(new Paragraph(" ", FontFactory.getFont(FontFactory.HELVETICA, 4)));
            cardCliente.addElement(new Paragraph(usuario.getNombre(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, SLATE_900)));
            cardCliente.addElement(new Paragraph(usuario.getCorreo(), FontFactory.getFont(FontFactory.HELVETICA, 8, SLATE_700)));
            if (usuario.getTelefono() != null && !usuario.getTelefono().isBlank()) {
                cardCliente.addElement(new Paragraph("Tel: " + usuario.getTelefono(), FontFactory.getFont(FontFactory.HELVETICA, 8, SLATE_500)));
            }
            if (direccion != null) {
                cardCliente.addElement(new Paragraph(" ", FontFactory.getFont(FontFactory.HELVETICA, 4)));
                cardCliente.addElement(new Paragraph("Envío:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, SLATE_500)));
                String dir = direccion.getCalle() + ", " + direccion.getCiudad() + ", " + direccion.getDepartamento();
                if (direccion.getCodigoPostal() != null && !direccion.getCodigoPostal().isBlank()) dir += " (" + direccion.getCodigoPostal() + ")";
                Paragraph pDir = new Paragraph(dir, FontFactory.getFont(FontFactory.HELVETICA, 8, SLATE_700));
                pDir.setSpacingBefore(2);
                cardCliente.addElement(pDir);
            }
            info.addCell(cardCliente);

            // Card Resumen
            PdfPCell cardResumen = crearCard();
            cardResumen.addElement(new Paragraph("Detalles del pedido", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, BRAND_INDIGO)));
            cardResumen.addElement(new Paragraph(" ", FontFactory.getFont(FontFactory.HELVETICA, 4)));
            agregarFilaResumen(cardResumen, "Pedido", "#" + pedido.getId());
            agregarFilaResumen(cardResumen, "Factura", factura.getNumeroFactura());
            agregarFilaResumen(cardResumen, "Fecha", factura.getEmitidaEn().format(FORMATO_FECHA_CORTA));
            agregarFilaResumen(cardResumen, "Items", String.valueOf(items.size()));
            if (pedido.getDiasEstimadosEntrega() != null) {
                agregarFilaResumen(cardResumen, "Entrega", pedido.getDiasEstimadosEntrega() + " días hábiles");
            }
            if (pago != null) {
                agregarFilaResumen(cardResumen, "Método pago", pago.getMetodo());
                Paragraph pEstado = new Paragraph("Estado pago: " + pago.getEstado(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, pagoColor(pago.getEstado())));
                pEstado.setSpacingBefore(6);
                cardResumen.addElement(pEstado);
            }
            if (pedido.getFechaEntregaDeseada() != null) {
                agregarFilaResumen(cardResumen, "Entrega deseada", pedido.getFechaEntregaDeseada().format(FORMATO_FECHA_CORTA));
            }
            if (pedido.getDestinatarioRegalo() != null && !pedido.getDestinatarioRegalo().isBlank()) {
                agregarFilaResumen(cardResumen, "Regalo para", pedido.getDestinatarioRegalo());
                if (pedido.getOcasionRegalo() != null) agregarFilaResumen(cardResumen, "Ocasión", pedido.getOcasionRegalo());
            }
            info.addCell(cardResumen);

            documento.add(info);
            documento.add(new Paragraph(" ", FontFactory.getFont(FontFactory.HELVETICA, 10)));

            // ---- TABLA PRODUCTOS con header indigo ----
            PdfPTable tabla = new PdfPTable(4);
            tabla.setWidthPercentage(100);
            tabla.setWidths(new float[]{4.2f, 1f, 1.6f, 1.6f});
            tabla.setSpacingBefore(4);

            Color headerBg = BRAND_INDIGO;
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, WHITE);
            agregarCeldaHeader(tabla, "Producto", headerFont, headerBg, Element.ALIGN_LEFT);
            agregarCeldaHeader(tabla, "Cant.", headerFont, headerBg, Element.ALIGN_CENTER);
            agregarCeldaHeader(tabla, "Precio unit.", headerFont, headerBg, Element.ALIGN_RIGHT);
            agregarCeldaHeader(tabla, "Subtotal", headerFont, headerBg, Element.ALIGN_RIGHT);

            Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 8, SLATE_700);
            Font cellBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, SLATE_900);
            boolean alt = false;
            for (ItemPedido item : items) {
                BigDecimal subtotalItem = item.getPrecioUnitario().multiply(BigDecimal.valueOf(item.getCantidad()));
                Color rowBg = alt ? SLATE_50 : WHITE;
                alt = !alt;

                PdfPCell c1 = celda(item.getProducto().getNombre(), cellFont, rowBg, Element.ALIGN_LEFT);
                // Si tiene variante (color/talla) mostrar?
                tabla.addCell(c1);
                tabla.addCell(celda(String.valueOf(item.getCantidad()), cellBold, rowBg, Element.ALIGN_CENTER));
                tabla.addCell(celda(formatearMoneda(item.getPrecioUnitario()), cellFont, rowBg, Element.ALIGN_RIGHT));
                tabla.addCell(celda(formatearMoneda(subtotalItem), cellBold, rowBg, Element.ALIGN_RIGHT));
            }

            documento.add(tabla);

            // ---- TOTALES (card derecha) ----
            PdfPTable totalesOuter = new PdfPTable(2);
            totalesOuter.setWidthPercentage(100);
            totalesOuter.setWidths(new float[]{1f, 1f});
            totalesOuter.setSpacingBefore(12);

            PdfPCell empty = new PdfPCell();
            empty.setBorder(Rectangle.NO_BORDER);
            totalesOuter.addCell(empty);

            PdfPCell totalesCard = new PdfPCell();
            totalesCard.setBackgroundColor(SLATE_100);
            totalesCard.setBorderColor(SLATE_200);
            totalesCard.setBorderWidth(1);
            totalesCard.setPadding(12);
            // Subtotal
            totalesCard.addElement(filaTotal("Subtotal", formatearMoneda(pedido.getSubtotal()), FontFactory.getFont(FontFactory.HELVETICA, 8, SLATE_700)));
            totalesCard.addElement(filaTotal("Descuento", "-" + formatearMoneda(pedido.getDescuento()), FontFactory.getFont(FontFactory.HELVETICA, 8, EMERALD)));
            String costoEmpaqueStr = pedido.getEmpaque() != null && pedido.getEmpaque().getCostoAdicional() != null ? formatearMoneda(pedido.getEmpaque().getCostoAdicional()) : formatearMoneda(BigDecimal.ZERO);
            totalesCard.addElement(filaTotal("Empaque", costoEmpaqueStr, FontFactory.getFont(FontFactory.HELVETICA, 8, SLATE_700)));
            totalesCard.addElement(filaTotal("Envío" + (pedido.getDiasEstimadosEntrega()!=null ? " ("+pedido.getDiasEstimadosEntrega()+" días)":""), formatearMoneda(pedido.getCostoEnvio()), FontFactory.getFont(FontFactory.HELVETICA, 8, SLATE_700)));

            // Total destacado con fondo indigo claro
            Paragraph totalP = new Paragraph();
            totalP.setSpacingBefore(8);
            totalP.add(new Paragraph("TOTAL PAGADO", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, BRAND_INDIGO)));
            Paragraph totalVal = new Paragraph(formatearMoneda(pedido.getTotal()), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, BRAND_INDIGO));
            totalVal.setSpacingBefore(2);
            totalesCard.addElement(totalP);
            totalesCard.addElement(totalVal);

            if (pago != null) {
                Paragraph pMetodoTot = new Paragraph("Pagado con " + pago.getMetodo() + " • " + pago.getEstado(), FontFactory.getFont(FontFactory.HELVETICA, 7, SLATE_500));
                pMetodoTot.setSpacingBefore(6);
                totalesCard.addElement(pMetodoTot);
            }

            totalesOuter.addCell(totalesCard);
            documento.add(totalesOuter);

            // ---- NOTA AGRADECIMIENTO ----
            PdfPTable gracias = new PdfPTable(1);
            gracias.setWidthPercentage(100);
            gracias.setSpacingBefore(18);
            PdfPCell gCell = new PdfPCell();
            gCell.setBackgroundColor(new Color(238, 242, 255)); // indigo-50
            gCell.setBorderColor(new Color(199, 210, 254)); // indigo-200
            gCell.setBorderWidth(1);
            gCell.setPadding(12);
            gCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            Paragraph gTitle = new Paragraph("¡Gracias por confiar en SKD! ✨", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, BRAND_INDIGO));
            gTitle.setAlignment(Element.ALIGN_CENTER);
            Paragraph gDesc = new Paragraph("Tu pedido pasa a producción. Te avisaremos por correo en cada cambio de estado y podrás seguirlo en vivo desde tu panel.", FontFactory.getFont(FontFactory.HELVETICA, 7, SLATE_700));
            gDesc.setAlignment(Element.ALIGN_CENTER);
            gDesc.setSpacingBefore(4);
            gCell.addElement(gTitle);
            gCell.addElement(gDesc);
            gracias.addCell(gCell);
            documento.add(gracias);

            // ---- FOOTER ----
            Paragraph footer = new Paragraph("SKD Creando Sueños  •  Sublimación personalizada en Colombia  •  hola@skdsublimacion.com  •  www.skdsublimacion.com", FontFactory.getFont(FontFactory.HELVETICA, 6, SLATE_400));
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(16);
            documento.add(footer);
            Paragraph footer2 = new Paragraph("Documento generado electrónicamente  •  Válido como comprobante de compra  •  " + java.time.LocalDate.now().format(FORMATO_FECHA_CORTA), FontFactory.getFont(FontFactory.HELVETICA, 6, SLATE_400));
            footer2.setAlignment(Element.ALIGN_CENTER);
            footer2.setSpacingBefore(2);
            documento.add(footer2);

            documento.close();
            return salida.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error al generar el PDF de la factura", e);
        }
    }

    // ---- Helpers UI ----

    private PdfPCell crearCard() {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(WHITE);
        cell.setBorderColor(SLATE_200);
        cell.setBorderWidth(1);
        cell.setPadding(12);
        cell.setVerticalAlignment(Element.ALIGN_TOP);
        return cell;
    }

    private void agregarFilaResumen(PdfPCell card, String label, String valor) {
        Paragraph p = new Paragraph();
        p.setSpacingBefore(3);
        p.add(new Paragraph(label + ":", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, SLATE_500)));
        Paragraph v = new Paragraph(valor, FontFactory.getFont(FontFactory.HELVETICA, 8, SLATE_900));
        v.setSpacingBefore(1);
        p.add(v);
        card.addElement(p);
    }

    private Paragraph filaTotal(String label, String valor, Font fontValor) {
        Paragraph p = new Paragraph();
        p.setSpacingBefore(3);
        // Use table 2 cols for label/value alignment
        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(100);
        try { t.setWidths(new float[]{1f, 1f}); } catch (Exception ignored) {}
        PdfPCell l = new PdfPCell(new Paragraph(label, FontFactory.getFont(FontFactory.HELVETICA, 7, SLATE_500)));
        l.setBorder(Rectangle.NO_BORDER);
        l.setHorizontalAlignment(Element.ALIGN_LEFT);
        l.setPadding(2);
        l.setBackgroundColor(SLATE_100);
        PdfPCell v = new PdfPCell(new Paragraph(valor, fontValor));
        v.setBorder(Rectangle.NO_BORDER);
        v.setHorizontalAlignment(Element.ALIGN_RIGHT);
        v.setPadding(2);
        v.setBackgroundColor(SLATE_100);
        t.addCell(l);
        t.addCell(v);
        // Wrap table in paragraph via cell? Instead return paragraph with table will not work directly.
        // So we create a cell wrapper: but filaTotal is Paragraph, we need to handle differently.
        // Simpler: return paragraph with label + valor aligned right using tab.
        Paragraph line = new Paragraph();
        line.add(new Paragraph(label + ":  " + valor, fontValor));
        line.setAlignment(Element.ALIGN_RIGHT);
        return line;
    }

    private void agregarCeldaHeader(PdfPTable tabla, String texto, Font fuente, Color bg, int align) {
        PdfPCell celda = new PdfPCell(new Paragraph(texto, fuente));
        celda.setBackgroundColor(bg);
        celda.setBorderColor(BRAND_INDIGO);
        celda.setBorderWidth(0.5f);
        celda.setPadding(7);
        celda.setHorizontalAlignment(align);
        celda.setVerticalAlignment(Element.ALIGN_MIDDLE);
        tabla.addCell(celda);
    }

    private PdfPCell celda(String texto, Font fuente, Color bg, int align) {
        PdfPCell c = new PdfPCell(new Paragraph(texto, fuente));
        c.setBackgroundColor(bg);
        c.setBorderColor(SLATE_200);
        c.setBorderWidth(0.5f);
        c.setPadding(6);
        c.setHorizontalAlignment(align);
        c.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return c;
    }

    private String formatearMoneda(BigDecimal valor) {
        if (valor == null) valor = BigDecimal.ZERO;
        NumberFormat nf = NumberFormat.getCurrencyInstance(new Locale("es", "CO"));
        nf.setMaximumFractionDigits(0);
        // NumberFormat already gives "$ 18.000", keep it. For 0 decimals, it will still be correct.
        return nf.format(valor);
    }

    private String formatearEstado(String estado) {
        if (estado == null) return "—";
        return switch (estado.toLowerCase()) {
            case "recibido" -> "Recibido";
            case "disenando" -> "En diseño";
            case "imprimiendo" -> "En impresión";
            case "empacando" -> "En empacado";
            case "enviado" -> "Enviado";
            case "entregado" -> "Entregado";
            case "cancelado" -> "Cancelado";
            default -> estado;
        };
    }

    private Color badgeBg(String estado) {
        if (estado == null) return SLATE_100;
        return switch (estado.toLowerCase()) {
            case "entregado" -> new Color(209, 250, 229);
            case "enviado" -> new Color(219, 234, 254);
            case "cancelado" -> new Color(254, 226, 226);
            default -> new Color(224, 242, 254);
        };
    }

    private Color badgeColor(String estado) {
        if (estado == null) return SLATE_500;
        return switch (estado.toLowerCase()) {
            case "entregado" -> new Color(6, 95, 70);
            case "enviado" -> new Color(30, 64, 175);
            case "cancelado" -> new Color(153, 27, 27);
            default -> new Color(12, 74, 110);
        };
    }

    private Color pagoColor(String estado) {
        if (estado == null) return SLATE_500;
        return switch (estado.toLowerCase()) {
            case "aprobado" -> EMERALD;
            case "pendiente" -> AMBER;
            case "rechazado", "error", "voided" -> new Color(220, 38, 38);
            default -> SLATE_500;
        };
    }
}
