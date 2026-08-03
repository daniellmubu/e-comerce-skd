package com.skd.sublimacion_api.controller.admin;

import com.skd.sublimacion_api.dto.usuario.UsuarioRequest;
import com.skd.sublimacion_api.dto.usuario.UsuarioResponse;
import com.skd.sublimacion_api.entity.Rol;
import com.skd.sublimacion_api.service.admin.AdminUsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import com.skd.sublimacion_api.dto.usuario.CambiarRolRequest;

@RestController
@RequestMapping("/api/admin/usuarios")
@RequiredArgsConstructor
public class AdminUsuarioController {

    private final AdminUsuarioService adminUsuarioService;

    @GetMapping
public Page<UsuarioResponse> listar(

        @RequestParam(required = false)
        String nombre,

        @RequestParam(required = false)
        String username,

        @RequestParam(required = false)
        String correo,

        @RequestParam(required = false)
        Rol rol,

        @RequestParam(required = false)
        Boolean bloqueado,

        @RequestParam(required = false)
        Boolean verificado,

        @PageableDefault(size = 10, sort = "id")
        Pageable pageable) {

    return adminUsuarioService.listar(
            nombre,
            username,
            correo,
            rol,
            bloqueado,
            verificado,
            pageable);
}

    @GetMapping("/{id}")
    public UsuarioResponse obtenerPorId(@PathVariable Long id) {

        return adminUsuarioService.obtenerPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse guardar(
            @Valid @RequestBody UsuarioRequest request) {

        return adminUsuarioService.guardar(request);
    }

    @PutMapping("/{id}")
    public UsuarioResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioRequest request) {

        return adminUsuarioService.actualizar(id, request);
    }

    @PatchMapping("/{id}/bloquear")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void bloquear(@PathVariable Long id) {

        adminUsuarioService.bloquear(id);
    }

    @PatchMapping("/{id}/desbloquear")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void desbloquear(@PathVariable Long id) {

        adminUsuarioService.desbloquear(id);
    }

    @PatchMapping("/{id}/rol")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cambiarRol(
            @PathVariable Long id,
            @Valid @RequestBody CambiarRolRequest request) {

        adminUsuarioService.cambiarRol(id, request);
    }
}