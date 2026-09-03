package com.skd.sublimacion_api.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.skd.sublimacion_api.entity.Usuario;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.skd.sublimacion_api.dto.direccion.DireccionRequest;
import com.skd.sublimacion_api.dto.direccion.DireccionResponse;
import com.skd.sublimacion_api.service.DireccionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/direcciones")
@RequiredArgsConstructor
public class DireccionController {

    private final DireccionService direccionService;

    @GetMapping("/{id}")
    public DireccionResponse obtener(@PathVariable Long id){
        return direccionService.obtenerPorId(id);
    }

    @GetMapping("/usuario/{usuarioId}")
    public List<DireccionResponse> listarPorUsuario(@PathVariable Long usuarioId){
        return direccionService.listarPorUsuario(usuarioId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DireccionResponse guardar(@RequestBody DireccionRequest request){
        return direccionService.guardar(request);
    }

    @PutMapping("/{id}")
    public DireccionResponse actualizar(@PathVariable Long id, @RequestBody DireccionRequest request, @AuthenticationPrincipal Usuario usuario){
        return direccionService.actualizar(id, request, usuario.getId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id, @AuthenticationPrincipal Usuario usuario){
        // Si hay usuario autenticado validar propiedad, sino fallback legacy
        if (usuario != null) direccionService.eliminar(id, usuario.getId());
        else direccionService.eliminar(id);
    }
}