package com.skd.sublimacion_api.service.impl.admin;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skd.sublimacion_api.dto.variante.VarianteRequest;
import com.skd.sublimacion_api.dto.variante.VarianteResponse;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.entity.VarianteProducto;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.repository.VarianteProductoRepository;
import com.skd.sublimacion_api.service.admin.AdminVarianteService;

import lombok.RequiredArgsConstructor;

/**
 * CRUD admin de variantes sobre la entidad canónica {@code VarianteProducto}
 * (la misma que usa el carrito y el endpoint público GET /api/productos/{id}/variantes).
 */
@Service
@RequiredArgsConstructor
public class AdminVarianteServiceImpl implements AdminVarianteService {

    private final VarianteProductoRepository varianteRepository;
    private final ProductoRepository productoRepository;

    @Override
    public List<VarianteResponse> listarPorProducto(Long productoId) {

        if (!productoRepository.existsById(productoId)) {
            throw new ResourceNotFoundException(
                    "Producto no encontrado con id: " + productoId);
        }

        return varianteRepository.findByProductoId(productoId)
                .stream()
                .sorted(Comparator.comparing(VarianteProducto::getId))
                .map(this::convertir)
                .toList();
    }

    @Override
    public VarianteResponse obtenerPorId(Long id) {
        return convertir(buscarVariante(id));
    }

    @Override
    @Transactional
    public VarianteResponse guardar(VarianteRequest request) {

        Producto producto = buscarProducto(request.getProductoId());

        validarUnica(request.getProductoId(), request.getTalla(), request.getColor(), null);

        VarianteProducto variante = VarianteProducto.builder()
                .producto(producto)
                .talla(request.getTalla().trim())
                .color(request.getColor().trim())
                .precio(request.getPrecio())
                .stock(request.getStock())
                .sku(opcional(request.getSku()))
                .build();

        return convertir(varianteRepository.save(variante));
    }

    @Override
    @Transactional
    public VarianteResponse actualizar(Long id, VarianteRequest request) {

        VarianteProducto variante = buscarVariante(id);

        validarUnica(request.getProductoId(), request.getTalla(), request.getColor(), id);

        variante.setProducto(buscarProducto(request.getProductoId()));
        variante.setTalla(request.getTalla().trim());
        variante.setColor(request.getColor().trim());
        variante.setPrecio(request.getPrecio());
        variante.setStock(request.getStock());
        variante.setSku(opcional(request.getSku()));

        return convertir(varianteRepository.save(variante));
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        varianteRepository.delete(buscarVariante(id));
    }

    private void validarUnica(Long productoId, String talla, String color, Long idActual) {

        varianteRepository.findByProductoIdAndTallaAndColor(
                        productoId, talla.trim(), color.trim())
                .ifPresent(existente -> {
                    if (idActual == null || !existente.getId().equals(idActual)) {
                        throw new IllegalArgumentException(
                                "Ya existe una variante con esa talla y color para este producto");
                    }
                });
    }

    private String opcional(String valor) {
        if (valor == null) {
            return null;
        }
        String recortado = valor.trim();
        return recortado.isEmpty() ? null : recortado;
    }

    private VarianteProducto buscarVariante(Long id) {
        return varianteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Variante no encontrada con id: " + id));
    }

    private Producto buscarProducto(Long id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Producto no encontrado con id: " + id));
    }

    private VarianteResponse convertir(VarianteProducto variante) {

        return VarianteResponse.builder()
                .id(variante.getId())
                .productoId(variante.getProducto().getId())
                .productoNombre(variante.getProducto().getNombre())
                .talla(variante.getTalla())
                .color(variante.getColor())
                .precio(variante.getPrecio())
                .stock(variante.getStock())
                .sku(variante.getSku())
                .build();
    }
}
