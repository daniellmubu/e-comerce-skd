package com.skd.sublimacion_api.service.impl;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skd.sublimacion_api.dto.resena.ResenaListaResponse;
import com.skd.sublimacion_api.dto.resena.ResenaRequest;
import com.skd.sublimacion_api.dto.resena.ResenaResponse;
import com.skd.sublimacion_api.entity.Producto;
import com.skd.sublimacion_api.entity.Resena;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.ItemPedidoRepository;
import com.skd.sublimacion_api.repository.ProductoRepository;
import com.skd.sublimacion_api.repository.ResenaRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.service.ResenaService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ResenaServiceImpl implements ResenaService {

    private final ResenaRepository resenaRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ItemPedidoRepository itemPedidoRepository;

    @Override
    @Transactional
    public ResenaResponse crear(ResenaRequest request, Long usuarioId) {

        Producto producto = productoRepository.findById(request.getProductoId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Producto no encontrado con id: " + request.getProductoId()));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuario no encontrado con id: " + usuarioId));

        if (resenaRepository.existsByProducto_IdAndUsuario_Id(
                request.getProductoId(), usuarioId)) {
            throw new IllegalArgumentException(
                    "Ya has reseñado este producto");
        }

        boolean compraAprobada = itemPedidoRepository.existeCompraAprobada(
                request.getProductoId(), usuarioId);

        if (!compraAprobada) {
            throw new IllegalArgumentException(
                    "Solo puedes reseñar productos que hayas comprado");
        }

        Resena resena = Resena.builder()
                .producto(producto)
                .usuario(usuario)
                .calificacion(request.getCalificacion())
                .comentario(request.getComentario())
                .build();

        return convertir(resenaRepository.save(resena));
    }

    @Override
    public ResenaListaResponse listarPorProducto(
            Long productoId,
            Pageable pageable) {

        if (!productoRepository.existsById(productoId)) {
            throw new ResourceNotFoundException(
                    "Producto no encontrado con id: " + productoId);
        }

        Page<Resena> pagina = resenaRepository
                .findByProducto_Id(productoId, pageable);

        List<ResenaResponse> contenido = pagina.getContent()
                .stream()
                .map(this::convertir)
                .toList();

        Double promedio = promedio(productoId);

        return ResenaListaResponse.builder()
                .promedio(promedio)
                .total(pagina.getTotalElements())
                .contenido(contenido)
                .pagina(pagina.getNumber())
                .tamanio(pagina.getSize())
                .totalPaginas(pagina.getTotalPages())
                .build();
    }

    private Double promedio(Long productoId) {

        List<Object[]> fila = resenaRepository
                .promedioYConteoPorProductoId(productoId);

        if (fila.isEmpty() || fila.get(0)[0] == null) {
            return 0.0;
        }

        double promedio = ((Number) fila.get(0)[0]).doubleValue();

        return Math.round(promedio * 10) / 10.0;
    }

    private ResenaResponse convertir(Resena resena) {

        return ResenaResponse.builder()
                .id(resena.getId())
                .productoId(resena.getProducto().getId())
                .usuarioId(resena.getUsuario().getId())
                .usuarioNombre(resena.getUsuario().getNombre())
                .calificacion(resena.getCalificacion())
                .comentario(resena.getComentario())
                .creadoEn(resena.getCreadoEn())
                .compraVerificada(true)
                .build();
    }
}