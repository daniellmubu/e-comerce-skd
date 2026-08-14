package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.dto.carrito.CarritoResponse;
import com.skd.sublimacion_api.entity.Carrito;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.CarritoRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.service.CarritoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CarritoServiceImpl implements CarritoService {

    private final CarritoRepository carritoRepository;
    private final UsuarioRepository usuarioRepository;

    @Override
    public List<CarritoResponse> listar() {

        return carritoRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public CarritoResponse obtenerPorId(Long id) {

        Carrito carrito = carritoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Carrito no encontrado"));

        return mapToResponse(carrito);
    }

    @Override
    public CarritoResponse obtenerPorUsuario(Long usuarioId) {

        Carrito carrito = carritoRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Carrito no encontrado"));

        return mapToResponse(carrito);
    }

    @Override
    public CarritoResponse guardar(Long usuarioId) {

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Carrito carrito = Carrito.builder()
                .usuario(usuario)
                .build();

        carritoRepository.save(carrito);

        return mapToResponse(carrito);
    }

    @Override
    public void eliminar(Long id) {

        Carrito carrito = carritoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Carrito no encontrado"));

        carritoRepository.delete(carrito);
    }

    private CarritoResponse mapToResponse(Carrito carrito) {

        return CarritoResponse.builder()
                .id(carrito.getId())
                .usuarioId(carrito.getUsuario().getId())
                .usuario(carrito.getUsuario().getNombre())
                .fechaCreacion(carrito.getFechaCreacion())
                .build();
    }

}