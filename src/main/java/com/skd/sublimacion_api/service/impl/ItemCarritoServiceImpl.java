package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.dto.detallecarrito.ItemCarritoRequest;
import com.skd.sublimacion_api.dto.detallecarrito.ItemCarritoResponse;
import com.skd.sublimacion_api.entity.Carrito;
import com.skd.sublimacion_api.entity.Diseno;
import com.skd.sublimacion_api.entity.ImagenProducto;
import com.skd.sublimacion_api.entity.ItemCarrito;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.entity.VarianteProducto;
import com.skd.sublimacion_api.exeption.BadRequestException;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.CarritoRepository;
import com.skd.sublimacion_api.repository.DisenoRepository;
import com.skd.sublimacion_api.repository.ImagenProductoRepository;
import com.skd.sublimacion_api.repository.ItemCarritoRepository;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.repository.VarianteProductoRepository;
import com.skd.sublimacion_api.service.ItemCarritoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemCarritoServiceImpl implements ItemCarritoService {

    private final ItemCarritoRepository detalleCarritoRepository;
    private final CarritoRepository carritoRepository;
    private final ProductoRepository productoRepository;
    private final DisenoRepository disenoRepository;
    private final VarianteProductoRepository varianteProductoRepository;
    private final ImagenProductoRepository imagenProductoRepository;

    @Override
    public ItemCarritoResponse obtenerPorId(Long id) {

        ItemCarrito detalle = detalleCarritoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Detalle del carrito no encontrado"));

        return convertir(detalle);
    }

    @Override
    public ItemCarritoResponse guardar(ItemCarritoRequest request, Long usuarioId) {

        Carrito carrito = carritoRepository.findById(request.getCarritoId())
                .orElseThrow(() -> new ResourceNotFoundException("Carrito no encontrado"));

        if (request.getProductoId() == null) {
            throw new BadRequestException("Debes elegir un producto antes de añadirlo al carrito.");
        }

        Producto producto = productoRepository.findById(request.getProductoId())
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));

        Diseno diseno = null;
        if (request.getDisenoId() != null) {
            diseno = disenoRepository.findById(request.getDisenoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Diseño no encontrado"));

            if (!diseno.getUsuario().getId().equals(usuarioId)) {
                throw new BadRequestException("Ese diseño no te pertenece.");
            }
        }

        VarianteProducto variante = null;
        if (request.getVarianteId() != null) {
            variante = varianteProductoRepository.findById(request.getVarianteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Variante no encontrada"));

            if (!variante.getProducto().getId().equals(producto.getId())) {
                throw new BadRequestException("La variante no pertenece a ese producto.");
            }
        }

        BigDecimal precioUnitario = variante != null
                ? variante.getPrecio()
                : producto.getPrecio();

        ItemCarrito detalle = ItemCarrito.builder()
                .carrito(carrito)
                .producto(producto)
                .diseno(diseno)
                .variante(variante)
                .cantidad(request.getCantidad())
                .precioUnitario(precioUnitario)
                .build();

        detalle = detalleCarritoRepository.save(detalle);

        return convertir(detalle);
    }

    @Override
    public void eliminar(Long id) {

        ItemCarrito detalle = detalleCarritoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Detalle del carrito no encontrado"));

        detalleCarritoRepository.delete(detalle);
    }

    @Override
    public List<ItemCarritoResponse> listarPorCarrito(Long carritoId) {

        return detalleCarritoRepository.findByCarritoId(carritoId)
                .stream()
                .map(this::convertir)
                .toList();
    }

    private ItemCarritoResponse convertir(ItemCarrito detalle) {

        BigDecimal subtotal = detalle.getPrecioUnitario()
                .multiply(BigDecimal.valueOf(detalle.getCantidad()));

        return ItemCarritoResponse.builder()
                .id(detalle.getId())
                .carritoId(detalle.getCarrito().getId())
                .productoId(detalle.getProducto().getId())
                .producto(detalle.getProducto().getNombre())
                .imagenUrl(imagenProductoUrl(detalle.getProducto()))
                .cantidad(detalle.getCantidad())
                .precioUnitario(detalle.getPrecioUnitario())
                .subtotal(subtotal)
                .disenoId(detalle.getDiseno() != null ? detalle.getDiseno().getId() : null)
                .imagenDisenoUrl(detalle.getDiseno() != null ? detalle.getDiseno().getImagenUrl() : null)
                .varianteId(detalle.getVariante() != null ? detalle.getVariante().getId() : null)
                .talla(detalle.getVariante() != null ? detalle.getVariante().getTalla() : null)
                .color(detalle.getVariante() != null ? detalle.getVariante().getColor() : null)
                .build();
    }

    private String imagenProductoUrl(Producto producto) {

        List<ImagenProducto> imagenes =
                imagenProductoRepository.findByProductoId(producto.getId());
        if (imagenes.isEmpty()) {
            return null;
        }
        return imagenes.stream()
                .filter(i -> Boolean.TRUE.equals(i.getEsPrincipal()))
                .findFirst()
                .orElse(imagenes.get(0))
                .getUrl();
    }
}
