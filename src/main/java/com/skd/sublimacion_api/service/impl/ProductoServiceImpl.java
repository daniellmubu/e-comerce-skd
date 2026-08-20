package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.repository.FavoritoRepository;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.repository.ResenaRepository;
import com.skd.sublimacion_api.service.ProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.CategoriaRepository;
import com.skd.sublimacion_api.dto.producto.ProductoBusquedaRequest;
import com.skd.sublimacion_api.dto.producto.ProductoListaResponse;
import com.skd.sublimacion_api.dto.producto.OrdenProducto;
import com.skd.sublimacion_api.dto.producto.ProductoRequest;
import com.skd.sublimacion_api.dto.producto.ProductoResponse;
import com.skd.sublimacion_api.entity.Categoria;
import com.skd.sublimacion_api.specification.ProductoSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProductoServiceImpl implements ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final ResenaRepository resenaRepository;
    private final FavoritoRepository favoritoRepository;

    @Override
    public List<ProductoResponse> listar(Long usuarioId) {

        ResumenResenas resumen = obtenerResumenResenas(usuarioId);

        return productoRepository.findByActivoTrue()
            .stream()
            .map(producto -> convertir(producto, resumen))
            .toList();
    }
    @Override
    public ProductoResponse guardar(ProductoRequest request) {

    Categoria categoria = categoriaRepository.findById(request.getCategoriaId())
            .orElseThrow(() ->
                    new ResourceNotFoundException(
                            "Categoría no encontrada con id: " + request.getCategoriaId()));

    Producto producto = Producto.builder()
            .nombre(request.getNombre())
            .descripcion(request.getDescripcion())
            .precio(request.getPrecio())
            .stock(request.getStock())
            .activo(request.getActivo())
            .masVendido(request.getMasVendido())
            .categoria(categoria)
            .build();

    Producto guardado = productoRepository.save(producto);

    return convertir(guardado, obtenerResumenResenas(null));
    }

    @Override
    public ProductoResponse actualizar(Long id, ProductoRequest request) {

        Producto producto = productoRepository.findById(id)
            .orElseThrow(() ->
                    new ResourceNotFoundException("Producto no encontrado con id: " + id));

        Categoria categoria = categoriaRepository.findById(request.getCategoriaId())
            .orElseThrow(() ->
                    new ResourceNotFoundException("Categoría no encontrada con id: " + request.getCategoriaId()));

        producto.setNombre(request.getNombre());
        producto.setDescripcion(request.getDescripcion());
        producto.setPrecio(request.getPrecio());
        producto.setStock(request.getStock());
        producto.setActivo(request.getActivo());
        producto.setMasVendido(request.getMasVendido());
        producto.setCategoria(categoria);

        Producto actualizado = productoRepository.save(producto);

        return convertir(actualizado, obtenerResumenResenas(null));
    }
    

    @Override
    public void eliminar(Long id) {

        Producto producto = productoRepository.findById(id)
            .orElseThrow(() ->
                    new ResourceNotFoundException("Producto no encontrado con id: " + id));

        productoRepository.delete(producto);
    }

    @Override
    public List<ProductoResponse> buscarPorCategoria(Long categoriaId, Long usuarioId) {

        ResumenResenas resumen = obtenerResumenResenas(usuarioId);

        return productoRepository.findByCategoriaId(categoriaId)
        .stream()
        .map(producto -> convertir(producto, resumen))
        .toList();
    }

    @Override
    public ProductoListaResponse buscar(
            ProductoBusquedaRequest filtros,
            Pageable pageable,
            Long usuarioId) {

        OrdenProducto orden = OrdenProducto.desdeValor(filtros.getOrdenarPor());

        Specification<Producto> specification = Specification
                .where(ProductoSpecification.activoEs(true))
                .and(ProductoSpecification.textoContiene(filtros.getTexto()))
                .and(ProductoSpecification.categoriaEs(filtros.getCategoriaId()))
                .and(ProductoSpecification.precioMayorIgual(filtros.getPrecioMin()))
                .and(ProductoSpecification.precioMenorIgual(filtros.getPrecioMax()))
                .and(ProductoSpecification.calificacionMinimaEs(
                        filtros.getCalificacionMinima()));

        // "mejorCalificado" ordena por el promedio calculado al vuelo, que no
        // está en la tabla producto. Se trae el set filtrado, se convierte con
        // el mismo resumen del catálogo y se ordena en memoria antes de paginar.
        if (orden == OrdenProducto.MEJOR_CALIFICADO) {
            return buscarMejorCalificado(specification, pageable, usuarioId);
        }

        Page<Producto> pagina = productoRepository
                .findAll(specification, aplicarOrden(pageable, orden));

        ResumenResenas resumen = obtenerResumenResenas(usuarioId);

        List<ProductoResponse> contenido = pagina.getContent()
                .stream()
                .map(producto -> convertir(producto, resumen))
                .toList();

        return ProductoListaResponse.builder()
                .contenido(contenido)
                .pagina(pagina.getNumber())
                .tamanio(pagina.getSize())
                .total(pagina.getTotalElements())
                .totalPaginas(pagina.getTotalPages())
                .build();
    }

    @Override
    public ProductoResponse obtenerPorId(Long id, Long usuarioId) {

        Producto producto = productoRepository.findById(id)
            .orElseThrow(() ->
                    new ResourceNotFoundException("Producto no encontrado con id: " + id));

        return convertir(producto, obtenerResumenResenas(usuarioId));
    }

    private Pageable aplicarOrden(Pageable pageable, OrdenProducto orden) {

        Sort sort = switch (orden) {
            case PRECIO_ASC -> Sort.by(Sort.Direction.ASC, "precio");
            case PRECIO_DESC -> Sort.by(Sort.Direction.DESC, "precio");
            case MAS_VENDIDO -> Sort.by(Sort.Direction.DESC, "masVendido")
                    .and(Sort.by(Sort.Direction.ASC, "id"));
            default -> Sort.unsorted();
        };

        return PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                sort);
    }

    private ProductoListaResponse buscarMejorCalificado(
            Specification<Producto> specification,
            Pageable pageable,
            Long usuarioId) {

        ResumenResenas resumen = obtenerResumenResenas(usuarioId);

        List<ProductoResponse> todos = productoRepository
                .findAll(specification)
                .stream()
                .map(producto -> convertir(producto, resumen))
                .sorted(Comparator.comparing(
                        ProductoResponse::getPromedioCalificacion,
                        Comparator.reverseOrder()))
                .toList();

        int total = todos.size();
        int inicio = Math.min(
                pageable.getPageNumber() * pageable.getPageSize(),
                total);
        int fin = Math.min(inicio + pageable.getPageSize(), total);

        int totalPaginas = pageable.getPageSize() == 0
                ? 0
                : (int) Math.ceil((double) total / pageable.getPageSize());

        return ProductoListaResponse.builder()
                .contenido(todos.subList(inicio, fin))
                .pagina(pageable.getPageNumber())
                .tamanio(pageable.getPageSize())
                .total(total)
                .totalPaginas(totalPaginas)
                .build();
    }

    private record ResumenResenas(
            Map<Long, Double> promedios,
            Map<Long, Long> conteos,
            Set<Long> favoritos) {}

    // Una sola consulta agregada para el catálogo:
    // SELECT producto_id, AVG(calificacion), COUNT(*) FROM resena GROUP BY producto_id
    // + si hay usuario autenticado, sus favoritos (1 query extra).
    private ResumenResenas obtenerResumenResenas(Long usuarioId) {

        Map<Long, Double> promedios = new HashMap<>();
        Map<Long, Long> conteos = new HashMap<>();

        for (Object[] fila : resenaRepository.promedioYConteoPorProducto()) {

            Long productoId = ((Number) fila[0]).longValue();
            promedios.put(productoId, ((Number) fila[1]).doubleValue());
            conteos.put(productoId, ((Number) fila[2]).longValue());
        }

        Set<Long> favoritos = usuarioId == null
                ? new HashSet<>()
                : favoritoRepository.findProductoIdsByUsuarioId(usuarioId);

        return new ResumenResenas(promedios, conteos, favoritos);
    }

    private ProductoResponse convertir(
            Producto producto,
            ResumenResenas resumen) {

        return ProductoResponse.builder()
                .id(producto.getId())
                .nombre(producto.getNombre())
                .descripcion(producto.getDescripcion())
                .precio(producto.getPrecio())
                .stock(producto.getStock())
                .activo(producto.getActivo())
                .masVendido(producto.getMasVendido())
                .categoria(producto.getCategoria().getNombre())
                .promedioCalificacion(
                        resumen.promedios.getOrDefault(producto.getId(), 0.0))
                .cantidadResenas(
                        resumen.conteos.getOrDefault(producto.getId(), 0L))
                .esFavorito(
                        resumen.favoritos().contains(producto.getId()))
                .build();
    }
}