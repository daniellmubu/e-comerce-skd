package com.skd.sublimacion_api.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id){
        direccionService.eliminar(id);
    }
}