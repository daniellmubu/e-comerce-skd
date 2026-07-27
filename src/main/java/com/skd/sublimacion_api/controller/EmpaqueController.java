package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.empaque.EmpaqueRequest;
import com.skd.sublimacion_api.dto.empaque.EmpaqueResponse;
import com.skd.sublimacion_api.service.EmpaqueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/empaques")
@RequiredArgsConstructor
public class EmpaqueController {

    private final EmpaqueService empaqueService;

    @GetMapping
    public List<EmpaqueResponse> listar() {
        return empaqueService.listar();
    }

    @GetMapping("/{id}")
    public EmpaqueResponse obtener(@PathVariable Long id) {
        return empaqueService.obtenerPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EmpaqueResponse guardar(@RequestBody EmpaqueRequest request) {
        return empaqueService.guardar(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        empaqueService.eliminar(id);
    }
}