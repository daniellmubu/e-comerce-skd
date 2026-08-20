package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.dto.cupon.CuponRequest;
import com.skd.sublimacion_api.dto.cupon.CuponResponse;
import com.skd.sublimacion_api.dto.cupon.CuponUsuarioResponse;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.service.CuponService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cupones")
@RequiredArgsConstructor
public class CuponController {

    private final CuponService cuponService;

    @GetMapping
    public List<CuponResponse> listar() {
        return cuponService.listar();
    }

    @GetMapping("/{id}")
    public CuponResponse obtener(@PathVariable Long id) {
        return cuponService.obtenerPorId(id);
    }

    @GetMapping("/mios")
    public List<CuponUsuarioResponse> misCupones(
            @AuthenticationPrincipal Usuario usuario) {
        return cuponService.listarMios(usuario.getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CuponResponse guardar(@RequestBody CuponRequest request) {
        return cuponService.guardar(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        cuponService.eliminar(id);
    }
}