package com.skd.sublimacion_api.service.impl.admin;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skd.sublimacion_api.dto.variante.VarianteRequest;
import com.skd.sublimacion_api.dto.variante.VarianteResponse;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.entity.Variante;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.repository.VarianteRepository;
import com.skd.sublimacion_api.service.admin.AdminVarianteService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminVarianteServiceImpl implements AdminVarianteService {

    private final VarianteRepository varianteRepository;
    private final ProductoRepository productoRepository;

    @Override
    public List<VarianteResponse> listarPorProducto(Long productoId) {

        if (!productoRepository.existsById(productoId)) {
            throw new ResourceNotFoundException(
                    "Producto no encontrado con id: " + productoId);
        }

        return varianteRepository.findByProductoIdOrderByIdAsc(productoId)
                .stream()
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

        validarUnica(request, null);

        Variante variante = Variante.builder()
                .producto(producto)
                .talla(normalizar(request.getTalla()))
                .color(normalizar(request.getColor()))
                .stock(request.getStock() == null ? 0 : request.getStock())
                .precio(request.getPrecio())
                .activo(request.getActivo() == null || request.getActivo())
                .build();

        return convertir(varianteRepository.save(variante));
    }

    @Override
    @Transactional
    public VarianteResponse actualizar(Long id, VarianteRequest request) {

        Variante variante = buscarVariante(id);

        validarUnica(request, id);

        variante.setProducto(buscarProducto(request.getProductoId()));
        variante.setTalla(normalizar(request.getTalla()));
        variante.setColor(normalizar(request.getColor()));
        variante.setStock(request.getStock() == null ? 0 : request.getStock());
        variante.setPrecio(request.getPrecio());
        variante.setActivo(request.getActivo() == null || request.getActivo());

        return convertir(varianteRepository.save(variante));
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        Variante variante = buscarVariante(id);
        varianteRepository.delete(variante);
    }

    private void validarUnica(VarianteRequest request, Long idActual) {

        String talla = normalizar(request.getTalla());
        String color = normalizar(request.getColor());

        List<Variante> existentes = varianteRepository
                .findByProductoIdOrderByIdAsc(request.getProductoId());

        boolean duplicada = existentes.stream().anyMatch(v -> {
            boolean mismoRegistro = idActual != null && v.getId().equals(idActual);
            if (mismoRegistro) {
                return false;
            }
            return normalizar(v.getTalla()).equals(talla)
                    && normalizar(v.getColor()).equals(color);
        });

        if (duplicada) {
            throw new IllegalArgumentException(
                    "Ya existe una variante con esa talla y color para este producto");
        }
    }

    private String normalizar(String valor) {
        if (valor == null) {
            return "";
        }
        return valor.trim();
    }

    private Variante buscarVariante(Long id) {
        return varianteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Variante no encontrada con id: " + id));
    }

    private Producto buscarProducto(Long id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Producto no encontrado con id: " + id));
    }

    private VarianteResponse convertir(Variante variante) {

        return VarianteResponse.builder()
                .id(variante.getId())
                .productoId(variante.getProducto().getId())
                .productoNombre(variante.getProducto().getNombre())
                .talla(esVacio(variante.getTalla()) ? null : variante.getTalla())
                .color(esVacio(variante.getColor()) ? null : variante.getColor())
                .stock(variante.getStock())
                .precio(variante.getPrecio())
                .activo(variante.getActivo())
                .build();
    }

    private boolean esVacio(String valor) {
        return valor == null || valor.isBlank();
    }
}
