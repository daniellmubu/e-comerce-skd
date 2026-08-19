package com.skd.sublimacion_api.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.skd.sublimacion_api.dto.direccion.DireccionRequest;
import com.skd.sublimacion_api.dto.direccion.DireccionResponse;
import com.skd.sublimacion_api.entity.Direccion;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.DireccionRepository;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.service.DireccionService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DireccionServiceImpl implements DireccionService {

    private final DireccionRepository direccionRepository;
    private final UsuarioRepository usuarioRepository;

    @Override
    public DireccionResponse obtenerPorId(Long id) {

        Direccion direccion = direccionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dirección no encontrada"));

        return convertir(direccion);
    }

    @Override
    public List<DireccionResponse> listarPorUsuario(Long usuarioId) {

        return direccionRepository.findByUsuarioId(usuarioId)
                .stream()
                .map(this::convertir)
                .toList();
    }

    @Override
    public DireccionResponse guardar(DireccionRequest request) {

        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Direccion direccion = Direccion.builder()
                .usuario(usuario)
                .calle(request.getCalle())
                .ciudad(request.getCiudad())
                .departamento(request.getDepartamento())
                .codigoPostal(request.getCodigoPostal())
                .predeterminada(request.getPredeterminada())
                .build();

        return convertir(direccionRepository.save(direccion));
    }

    @Override
    public void eliminar(Long id) {

        Direccion direccion = direccionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dirección no encontrada"));

        direccionRepository.delete(direccion);
    }

    private DireccionResponse convertir(Direccion direccion){

        return DireccionResponse.builder()
                .id(direccion.getId())
                .usuarioId(direccion.getUsuario().getId())
                .usuario(direccion.getUsuario().getNombre())
                .calle(direccion.getCalle())
                .ciudad(direccion.getCiudad())
                .departamento(direccion.getDepartamento())
                .codigoPostal(direccion.getCodigoPostal())
                .predeterminada(direccion.getPredeterminada())
                .build();
    }
}