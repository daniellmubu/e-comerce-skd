package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.dto.detallecarrito.ItemCarritoRequest;
import com.skd.sublimacion_api.dto.detallecarrito.ItemCarritoResponse;
import com.skd.sublimacion_api.entity.Carrito;
import com.skd.sublimacion_api.entity.Diseno;
import com.skd.sublimacion_api.entity.EstadoPublicacionDiseno;
import com.skd.sublimacion_api.entity.ImagenProducto;
import com.skd.sublimacion_api.entity.ItemCarrito;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.entity.VarianteProducto;
import com.skd.sublimacion_api.exeption.BadRequestException;
import com.skd.sublimacion_api.exeption.ForbiddenException;
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

            // Se permite el diseño propio y también cualquier diseño aprobado
            // en la galería pública (así los usuarios pueden "usar" creaciones
            // de otros, lo que alimenta la métrica de popularidad por usos).
            boolean esPropio = diseno.getUsuario().getId().equals(usuarioId);
            boolean esPublico = diseno.getEstadoPublicacion() == EstadoPublicacionDiseno.PUBLICADO;
            if (!esPropio && !esPublico) {
                throw new BadRequestException("Ese diseño no te pertenece o no está publicado.");
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

        // Validar que el carrito pertenezca al usuario autenticado
        if (!carrito.getUsuario().getId().equals(usuarioId)) {
            throw new ForbiddenException("No tienes permiso para modificar este carrito.");
        }

        // Validación de stock: bloquea compra si producto/variante agotado o cantidad excede stock
        if (variante != null) {
            if (variante.getStock() == null || variante.getStock() <= 0) {
                throw new BadRequestException("Variante sin stock. No es posible añadirla al carrito.");
            }
            if (request.getCantidad() > variante.getStock()) {
                throw new BadRequestException("Stock máximo disponible para esta variante: " + variante.getStock());
            }
        } else {
            if (producto.getStock() == null || producto.getStock() <= 0) {
                throw new BadRequestException("Producto sin stock. No es posible añadirlo al carrito.");
            }
            if (request.getCantidad() > producto.getStock()) {
                throw new BadRequestException("Stock máximo disponible: " + producto.getStock());
            }
        }

        BigDecimal precioUnitario = variante != null
                ? variante.getPrecio()
                : producto.getPrecio();

        // TC-CART-12: si ya existe mismo producto+variante+diseno en el carrito, sumar cantidad en vez de duplicar
        // Esto evita inconsistencias cuando el usuario tiene 2 pestañas/dispositivos simultáneos
        Long varianteId = variante != null ? variante.getId() : null;
        final Diseno disenoFinal = diseno;
        final VarianteProducto varianteFinal = variante;
        // Buscar existente con misma combinación (producto+variante). Si tiene diseño, debe coincidir también.
        java.util.Optional<ItemCarrito> existenteOpt = detalleCarritoRepository
                .findByCarritoIdAndProductoIdAndVarianteId(carrito.getId(), producto.getId(), varianteId)
                .filter(e -> java.util.Objects.equals(
                        e.getDiseno() != null ? e.getDiseno().getId() : null,
                        disenoFinal != null ? disenoFinal.getId() : null));
        if (existenteOpt.isPresent()) {
            ItemCarrito existente = existenteOpt.get();
            int nuevaCantidad = existente.getCantidad() + request.getCantidad();
            int stockDisponible = variante != null ? variante.getStock() : producto.getStock();
            if (nuevaCantidad > stockDisponible) {
                throw new BadRequestException("Stock máximo disponible: " + stockDisponible + ". Ya tienes " + existente.getCantidad() + " en el carrito.");
            }
            existente.setCantidad(nuevaCantidad);
            existente = detalleCarritoRepository.save(existente);
            return convertir(existente);
        }

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
    public ItemCarritoResponse actualizarCantidad(Long id, Integer nuevaCantidad, Long usuarioId) {
        if (nuevaCantidad == null || nuevaCantidad <= 0) {
            throw new BadRequestException("La cantidad debe ser mayor a 0.");
        }
        ItemCarrito detalle = detalleCarritoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Detalle del carrito no encontrado"));

        // Validar propiedad del carrito
        if (!detalle.getCarrito().getUsuario().getId().equals(usuarioId)) {
            throw new ForbiddenException("No tienes permiso para modificar este carrito.");
        }

        // Validar stock según variante o producto
        if (detalle.getVariante() != null) {
            if (detalle.getVariante().getStock() == null || detalle.getVariante().getStock() <= 0) {
                throw new BadRequestException("Variante sin stock.");
            }
            if (nuevaCantidad > detalle.getVariante().getStock()) {
                throw new BadRequestException("Stock máximo disponible para esta variante: " + detalle.getVariante().getStock());
            }
        } else {
            if (detalle.getProducto().getStock() == null || detalle.getProducto().getStock() <= 0) {
                throw new BadRequestException("Producto sin stock.");
            }
            if (nuevaCantidad > detalle.getProducto().getStock()) {
                throw new BadRequestException("Stock máximo disponible: " + detalle.getProducto().getStock());
            }
        }

        detalle.setCantidad(nuevaCantidad);
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
