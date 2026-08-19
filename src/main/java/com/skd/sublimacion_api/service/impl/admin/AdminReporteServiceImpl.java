package com.skd.sublimacion_api.service.impl.admin;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.skd.sublimacion_api.entity.Pedido;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.repository.ItemPedidoRepository;
import com.skd.sublimacion_api.repository.PedidoRepository;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.service.admin.AdminReporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminReporteServiceImpl implements AdminReporteService {

    private static final DateTimeFormatter FORMATO_FECHA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final PedidoRepository pedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;
    private final ItemPedidoRepository itemPedidoRepository;

    @Override
    @Transactional(readOnly = true)
    public byte[] exportarCsv(String tipo) {
        ReporteData datos = construirReporte(tipo);
        return construirCsv(datos).getBytes(StandardCharsets.UTF_8);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportarPdf(String tipo) {
        ReporteData datos = construirReporte(tipo);
        return construirPdf(datos);
    }

    private ReporteData construirReporte(String tipo) {
        return switch (tipo == null ? "" : tipo.toLowerCase()) {
            case "ventas" -> reporteVentas();
            case "pedidos" -> reportePedidos();
            case "usuarios" -> reporteUsuarios();
            case "productos" -> reporteProductos();
            default -> throw new IllegalArgumentException(
                    "Tipo de reporte inválido. Valores permitidos: ventas, pedidos, usuarios, productos");
        };
    }

    private ReporteData reporteVentas() {
        List<String[]> filas = new ArrayList<>();

        for (Pedido p : pedidoRepository.findAll()) {
            if ("cancelado".equalsIgnoreCase(p.getEstado())) {
                continue;
            }
            filas.add(new String[]{
                    String.valueOf(p.getId()),
                    p.getCreadoEn() != null ? p.getCreadoEn().format(FORMATO_FECHA) : "",
                    p.getUsuario().getNombre(),
                    p.getEstado(),
                    formatearMoneda(p.getTotal())
            });
        }

        return new ReporteData("Reporte de Ventas",
                new String[]{"ID", "Fecha", "Cliente", "Estado", "Total"}, filas);
    }

    private ReporteData reportePedidos() {
        List<String[]> filas = new ArrayList<>();

        for (Pedido p : pedidoRepository.findAll()) {
            int numItems = itemPedidoRepository.findByPedidoId(p.getId()).size();
            filas.add(new String[]{
                    String.valueOf(p.getId()),
                    p.getCreadoEn() != null ? p.getCreadoEn().format(FORMATO_FECHA) : "",
                    p.getUsuario().getNombre(),
                    p.getEstado(),
                    String.valueOf(numItems),
                    formatearMoneda(p.getTotal())
            });
        }

        return new ReporteData("Reporte de Pedidos",
                new String[]{"ID", "Fecha", "Cliente", "Estado", "Items", "Total"}, filas);
    }

    private ReporteData reporteUsuarios() {
        List<String[]> filas = new ArrayList<>();

        for (Usuario u : usuarioRepository.findAll()) {
            filas.add(new String[]{
                    String.valueOf(u.getId()),
                    u.getNombre(),
                    u.getUsername(),
                    u.getCorreo(),
                    u.getRol().name(),
                    Boolean.TRUE.equals(u.getBloqueado()) ? "Sí" : "No"
            });
        }

        return new ReporteData("Reporte de Usuarios",
                new String[]{"ID", "Nombre", "Username", "Correo", "Rol", "Bloqueado"}, filas);
    }

    private ReporteData reporteProductos() {
        List<String[]> filas = new ArrayList<>();

        for (Producto pr : productoRepository.findAll()) {
            filas.add(new String[]{
                    String.valueOf(pr.getId()),
                    pr.getNombre(),
                    pr.getCategoria() != null ? pr.getCategoria().getNombre() : "",
                    formatearMoneda(pr.getPrecio()),
                    String.valueOf(pr.getStock()),
                    Boolean.TRUE.equals(pr.getActivo()) ? "Activo" : "Inactivo"
            });
        }

        return new ReporteData("Reporte de Productos",
                new String[]{"ID", "Nombre", "Categoría", "Precio", "Stock", "Estado"}, filas);
    }

    private String construirCsv(ReporteData datos) {
        StringBuilder sb = new StringBuilder();
        // BOM UTF-8 para que Excel interprete correctamente los acentos.
        sb.append('\uFEFF');
        sb.append(joinFila(datos.encabezados()));
        for (String[] fila : datos.filas()) {
            sb.append(joinFila(fila));
        }
        return sb.toString();
    }

    private String joinFila(String[] valores) {
        List<String> celdas = new ArrayList<>();
        for (String v : valores) {
            String limpio = v == null ? "" : v.replace("\"", "\"\"");
            celdas.add("\"" + limpio + "\"");
        }
        return String.join(";", celdas) + "\r\n";
    }

    private byte[] construirPdf(ReporteData datos) {
        try {
            ByteArrayOutputStream salida = new ByteArrayOutputStream();
            Document documento = new Document(PageSize.A4.rotate(), 30, 30, 40, 40);
            PdfWriter.getInstance(documento, salida);
            documento.open();

            Font fuenteTitulo = FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD, 16, new Color(30, 30, 30));
            Paragraph titulo = new Paragraph("SKD - Sublimación de Sueños", fuenteTitulo);
            titulo.setAlignment(Element.ALIGN_CENTER);
            documento.add(titulo);

            Font fuenteSubtitulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Paragraph subtitulo = new Paragraph(datos.titulo(), fuenteSubtitulo);
            subtitulo.setAlignment(Element.ALIGN_CENTER);
            subtitulo.setSpacingAfter(15);
            documento.add(subtitulo);

            PdfPTable tabla = new PdfPTable(datos.encabezados().length);
            tabla.setWidthPercentage(100);

            Font fuenteNegrita = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
            Font fuenteNormal = FontFactory.getFont(FontFactory.HELVETICA, 9);

            for (String encabezado : datos.encabezados()) {
                PdfPCell celda = new PdfPCell(new Paragraph(encabezado, fuenteNegrita));
                celda.setBackgroundColor(new Color(230, 230, 230));
                celda.setPadding(5);
                tabla.addCell(celda);
            }

            for (String[] fila : datos.filas()) {
                for (String valor : fila) {
                    tabla.addCell(new PdfPCell(new Paragraph(valor == null ? "" : valor, fuenteNormal)));
                }
            }

            documento.add(tabla);
            documento.close();
            return salida.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error al generar el PDF del reporte", e);
        }
    }

    private String formatearMoneda(BigDecimal valor) {
        if (valor == null) {
            valor = BigDecimal.ZERO;
        }
        return "$" + String.format("%,.2f", valor);
    }

    private record ReporteData(String titulo, String[] encabezados, List<String[]> filas) {
    }
}
