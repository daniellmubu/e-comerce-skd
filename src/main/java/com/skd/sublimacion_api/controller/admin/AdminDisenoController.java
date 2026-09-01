package com.skd.sublimacion_api.controller.admin;

import com.skd.sublimacion_api.dto.diseno.DisenoAdminResponse;
import com.skd.sublimacion_api.dto.diseno.ModerarDisenoRequest;
import com.skd.sublimacion_api.service.admin.AdminDisenoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/disenos")
@RequiredArgsConstructor
@Tag(
        name = "Administración - Diseños",
        description = "Moderación de los diseños públicos creados por usuarios: " +
                "aprobar, rechazar, ocultar y métricas de popularidad (me gusta y usos)."
)
public class AdminDisenoController {

    private final AdminDisenoService adminDisenoService;

    @Operation(summary = "Listar diseños enviados a moderación",
            description = "Listado paginado. Filtros: estado (pendiente, publicado, rechazado, oculto) y búsqueda por título.")
    @GetMapping
    public Page<DisenoAdminResponse> listar(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String busqueda,
            @PageableDefault(size = 10, sort = "createdAt",
                    direction = Sort.Direction.DESC) Pageable pageable) {

        return adminDisenoService.listar(estado, busqueda, pageable);
    }

    @Operation(summary = "Resumen por estado de publicación")
    @GetMapping("/resumen")
    public Map<String, Long> resumen() {
        return adminDisenoService.resumen();
    }

    @Operation(summary = "Top diseños por me gusta")
    @GetMapping("/top/megusta")
    public List<DisenoAdminResponse> topMeGusta(
            @RequestParam(defaultValue = "10") int limite) {
        return adminDisenoService.topMeGusta(limite);
    }

    @Operation(summary = "Top diseños más utilizados")
    @GetMapping("/top/usos")
    public List<DisenoAdminResponse> topUsos(
            @RequestParam(defaultValue = "10") int limite) {
        return adminDisenoService.topUsos(limite);
    }

    @Operation(summary = "Detalle de un diseño")
    @GetMapping("/{id}")
    public DisenoAdminResponse obtenerPorId(@PathVariable Long id) {
        return adminDisenoService.obtenerPorId(id);
    }

    @Operation(summary = "Aprobar diseño")
    @PatchMapping("/{id}/aprobar")
    public DisenoAdminResponse aprobar(@PathVariable Long id) {
        return adminDisenoService.aprobar(id);
    }

    @Operation(summary = "Rechazar diseño",
            description = "El motivo se le muestra al dueño en 'Mis diseños'.")
    @PatchMapping("/{id}/rechazar")
    public DisenoAdminResponse rechazar(@PathVariable Long id,
                                        @RequestBody(required = false) ModerarDisenoRequest request) {
        return adminDisenoService.rechazar(id,
                request != null ? request.getMotivo() : null);
    }

    @Operation(summary = "Ocultar diseño",
            description = "Retira un diseño ya publicado (por denuncias o revisión).")
    @PatchMapping("/{id}/ocultar")
    public DisenoAdminResponse ocultar(@PathVariable Long id,
                                       @RequestBody(required = false) ModerarDisenoRequest request) {
        return adminDisenoService.ocultar(id,
                request != null ? request.getMotivo() : null);
    }

    @Operation(summary = "Eliminar diseño")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        adminDisenoService.eliminar(id);
    }
}
