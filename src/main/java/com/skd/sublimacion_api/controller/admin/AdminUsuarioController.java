package com.skd.sublimacion_api.controller.admin;

import com.skd.sublimacion_api.dto.usuario.UsuarioRequest;
import com.skd.sublimacion_api.dto.usuario.UsuarioResponse;
import com.skd.sublimacion_api.entity.Rol;
import com.skd.sublimacion_api.service.admin.AdminUsuarioService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(
        name = "Administración - Usuarios",
        description = "Endpoints para la administración de usuarios."
)
public class AdminUsuarioController {

    private final AdminUsuarioService adminUsuarioService;

    @Operation(
        summary = "Listar usuarios",
        description = "Obtiene un listado paginado de usuarios registrados."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado obtenido correctamente")
    })
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

    @Operation(
        summary = "Obtener usuario por ID",
        description = "Obtiene la información de un usuario."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Usuario encontrado"),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @GetMapping("/{id}")
    public UsuarioResponse obtenerPorId(@PathVariable Long id) {

        return adminUsuarioService.obtenerPorId(id);
    }


    @Operation(
        summary = "Crear usuario",
        description = "Registra un nuevo usuario."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Usuario creado correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse guardar(
            @Valid @RequestBody UsuarioRequest request) {

        return adminUsuarioService.guardar(request);
    }


    @Operation(
        summary = "Actualizar usuario",
        description = "Actualiza la información de un usuario."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Usuario actualizado"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos"),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @PutMapping("/{id}")
    public UsuarioResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioRequest request) {

        return adminUsuarioService.actualizar(id, request);
    }


    @Operation(
        summary = "Bloquear usuario",
        description = "Bloquea el acceso de un usuario."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Usuario bloqueado"),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @PatchMapping("/{id}/bloquear")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void bloquear(@PathVariable Long id) {

        adminUsuarioService.bloquear(id);
    }


    @Operation(
        summary = "Desbloquear usuario",
        description = "Restablece el acceso de un usuario bloqueado."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Usuario desbloqueado"),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
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