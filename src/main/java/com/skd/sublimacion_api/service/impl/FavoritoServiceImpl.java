package com.skd.sublimacion_api.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skd.sublimacion_api.dto.favorito.FavoritoListaResponse;
import com.skd.sublimacion_api.dto.favorito.FavoritoResponse;
import com.skd.sublimacion_api.dto.producto.ProductoResponse;
import com.skd.sublimacion_api.entity.Favorito;
import com.skd.sublimacion_api.entity.ImagenProducto;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.FavoritoRepository;
import com.skd.sublimacion_api.repository.ImagenProductoRepository;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.repository.ResenaRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.service.FavoritoService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FavoritoServiceImpl implements FavoritoService {

    private final FavoritoRepository favoritoRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ImagenProductoRepository imagenProductoRepository;
    private final ResenaRepository resenaRepository;

    @Override
    @Transactional
    public FavoritoAgregado agregar(Long productoId, Long usuarioId) {

        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Producto no encontrado con id: " + productoId));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuario no encontrado con id: " + usuarioId));

        boolean creado = !favoritoRepository
                .existsByUsuario_IdAndProducto_Id(usuarioId, productoId);

        Favorito favorito = creado
                ? favoritoRepository.save(Favorito.builder()
                        .usuario(usuario)
                        .producto(producto)
                        .build())
                : favoritoRepository
                        .findByUsuario_IdAndProducto_Id(usuarioId, productoId)
                        .orElseThrow();

        return new FavoritoAgregado(convertir(favorito), creado);
    }

    @Override
    @Transactional
    public void eliminar(Long productoId, Long usuarioId) {

        favoritoRepository.deleteByUsuario_IdAndProducto_Id(
                usuarioId, productoId);
    }

    @Override
    public FavoritoListaResponse listarMios(
            Long usuarioId,
            Pageable pageable) {

        Page<Favorito> pagina = favoritoRepository
                .findByUsuario_IdActivos(usuarioId, pageable);

        Map<Long, Double> promedios = new HashMap<>();
        Map<Long, Long> conteos = new HashMap<>();

        for (Object[] fila : resenaRepository.promedioYConteoPorProducto()) {

            Long id = ((Number) fila[0]).longValue();
            promedios.put(id, ((Number) fila[1]).doubleValue());
            conteos.put(id, ((Number) fila[2]).longValue());
        }

        List<FavoritoResponse> contenido = pagina.getContent()
                .stream()
                .map(favorito -> convertir(favorito, promedios, conteos))
                .toList();

        return FavoritoListaResponse.builder()
                .contenido(contenido)
                .pagina(pagina.getNumber())
                .tamanio(pagina.getSize())
                .total(pagina.getTotalElements())
                .totalPaginas(pagina.getTotalPages())
                .build();
    }

    private FavoritoResponse convertir(Favorito favorito) {

        return convertir(favorito, new HashMap<>(), new HashMap<>());
    }

    private FavoritoResponse convertir(
            Favorito favorito,
            Map<Long, Double> promedios,
            Map<Long, Long> conteos) {

        Producto producto = favorito.getProducto();

        ProductoResponse productoResponse = ProductoResponse.builder()
                .id(producto.getId())
                .nombre(producto.getNombre())
                .descripcion(producto.getDescripcion())
                .precio(producto.getPrecio())
                .stock(producto.getStock())
                .activo(producto.getActivo())
                .masVendido(producto.getMasVendido())
                .categoria(producto.getCategoria().getNombre())
                .promedioCalificacion(
                        promedios.getOrDefault(producto.getId(), 0.0))
                .cantidadResenas(
                        conteos.getOrDefault(producto.getId(), 0L))
                .esFavorito(true)
                .build();

        return FavoritoResponse.builder()
                .id(favorito.getId())
                .fechaAgregado(favorito.getAgregadoEn())
                .imagenUrl(imagenPrincipal(producto))
                .producto(productoResponse)
                .build();
    }

    private String imagenPrincipal(Producto producto) {

        List<ImagenProducto> imagenes = imagenProductoRepository
                .findByProductoId(producto.getId());

        return imagenes.stream()
                .filter(imagen -> Boolean.TRUE.equals(imagen.getEsPrincipal()))
                .map(ImagenProducto::getUrl)
                .findFirst()
                .orElse(imagenes.isEmpty()
                        ? null
                        : imagenes.get(0).getUrl());
    }
}