package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.dto.personalizacion.PersonalizacionRequest;
import com.skd.sublimacion_api.dto.personalizacion.PersonalizacionResponse;
import com.skd.sublimacion_api.entity.ItemCarrito;
import com.skd.sublimacion_api.entity.Personalizacion;
import com.skd.sublimacion_api.exeption.BadRequestException;
import com.skd.sublimacion_api.exeption.ResourceNotFoundException;
import com.skd.sublimacion_api.repository.ItemCarritoRepository;
import com.skd.sublimacion_api.repository.PersonalizacionRepository;
import com.skd.sublimacion_api.service.PersonalizacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PersonalizacionServiceImpl implements PersonalizacionService {

    private final PersonalizacionRepository personalizacionRepository;
    private final ItemCarritoRepository itemCarritoRepository;

    @Override
    public PersonalizacionResponse guardar(PersonalizacionRequest request, Long usuarioId) {

        ItemCarrito item = itemCarritoRepository.findById(request.getItemCarritoId())
                .orElseThrow(() -> new ResourceNotFoundException("Ítem del carrito no encontrado"));

        // El ítem debe pertenecer al carrito del usuario autenticado.
        if (!item.getCarrito().getUsuario().getId().equals(usuarioId)) {
            throw new BadRequestException("Ese ítem del carrito no te pertenece.");
        }

        // Upsert: si ya existe una personalización para este ítem, se actualiza
        // en vez de crear una duplicada.
        Personalizacion personalizacion = personalizacionRepository
                .findByItemCarritoId(item.getId())
                .orElseGet(() -> Personalizacion.builder().itemCarrito(item).build());

        personalizacion.setImagenUrl(request.getImagenUrl());
        personalizacion.setTexto(request.getTexto());
        personalizacion.setRotacion(request.getRotacion());
        personalizacion.setEscala(request.getEscala());
        personalizacion.setCostoAdicional(request.getCostoAdicional());

        return convertir(personalizacionRepository.save(personalizacion));
    }

    @Override
    public PersonalizacionResponse obtenerPorItemCarrito(Long itemCarritoId, Long usuarioId) {

        Personalizacion personalizacion = personalizacionRepository
                .findByItemCarritoId(itemCarritoId)
                .orElseThrow(() -> new ResourceNotFoundException("Personalización no encontrada"));

        if (!personalizacion.getItemCarrito().getCarrito().getUsuario().getId().equals(usuarioId)) {
            throw new BadRequestException("Esa personalización no te pertenece.");
        }

        return convertir(personalizacion);
    }

    private PersonalizacionResponse convertir(Personalizacion personalizacion) {
        return PersonalizacionResponse.builder()
                .id(personalizacion.getId())
                .itemCarritoId(personalizacion.getItemCarrito().getId())
                .imagenUrl(personalizacion.getImagenUrl())
                .texto(personalizacion.getTexto())
                .rotacion(personalizacion.getRotacion())
                .escala(personalizacion.getEscala())
                .costoAdicional(personalizacion.getCostoAdicional())
                .build();
    }
}
