package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.personalizacion.PersonalizacionRequest;
import com.skd.sublimacion_api.dto.personalizacion.PersonalizacionResponse;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.service.PersonalizacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/personalizaciones")
@RequiredArgsConstructor
public class PersonalizacionController {

    private final PersonalizacionService personalizacionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PersonalizacionResponse guardar(@Valid @RequestBody PersonalizacionRequest request,
                                           @AuthenticationPrincipal Usuario usuario) {
        return personalizacionService.guardar(request, usuario.getId());
    }

    @GetMapping("/item-carrito/{itemCarritoId}")
    public PersonalizacionResponse obtenerPorItemCarrito(@PathVariable Long itemCarritoId,
                                                         @AuthenticationPrincipal Usuario usuario) {
        return personalizacionService.obtenerPorItemCarrito(itemCarritoId, usuario.getId());
    }
}
