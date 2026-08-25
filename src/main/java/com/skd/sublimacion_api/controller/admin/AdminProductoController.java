package com.skd.sublimacion_api.controller.admin;

import com.skd.sublimacion_api.dto.producto.ProductoResponse;
import com.skd.sublimacion_api.dto.producto.ProductoAjustePrecioRequest;
import com.skd.sublimacion_api.service.admin.AdminProductoService;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import com.skd.sublimacion_api.dto.producto.ProductoRequest;
import com.skd.sublimacion_api.exeption.BadRequestException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/admin/productos")
@RequiredArgsConstructor
@Tag(
        name = "Administración - Productos",
        description = "Endpoints para la gestión de productos del panel administrativo."
)
public class AdminProductoController {

    private final AdminProductoService adminProductoService;

    @Operation(
        summary = "Listar productos",
        description = "Obtiene un listado paginado de productos con filtros opcionales."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado obtenido correctamente")
    })

    @GetMapping
    public Page<ProductoResponse> listar(

            @Parameter(description = "Nombre del producto")
            @RequestParam(required = false)
            String nombre,

            @Parameter(description = "ID de la categoría")
            @RequestParam(required = false)
            Long categoriaId,

            @Parameter(description = "Estado del producto")
            @RequestParam(required = false)
            Boolean activo,

            @Parameter(description = "Precio mínimo")
            @RequestParam(required = false)
            BigDecimal precioMin,

            @Parameter(description = "Precio máximo")
            @RequestParam(required = false)
            BigDecimal precioMax,

            @PageableDefault(size = 10, sort = "id")
            Pageable pageable
    ) {

        return adminProductoService.listar(
                nombre,
                categoriaId,
                activo,
                precioMin,
                precioMax,
                pageable
        );

    }


    @Operation(
        summary = "Obtener producto por ID",
        description = "Obtiene la información de un producto específico."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Producto encontrado"),
            @ApiResponse(responseCode = "404", description = "Producto no encontrado")
    })

    @GetMapping("/{id}")
    public ProductoResponse obtenerPorId(
            @PathVariable Long id) {

        return adminProductoService.obtenerPorId(id);
    }


    @Operation(
        summary = "Crear producto",
        description = "Registra un nuevo producto."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Producto creado correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos")
    })


    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductoResponse guardar(
            @Valid @RequestBody ProductoRequest request) {

        return adminProductoService.guardar(request);
    }


    @Operation(
        summary = "Actualizar producto",
        description = "Actualiza la información de un producto."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Producto actualizado correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos"),
            @ApiResponse(responseCode = "404", description = "Producto no encontrado")
    })
    @PutMapping("/{id}")
    public ProductoResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ProductoRequest request) {

        return adminProductoService.actualizar(id, request);
    }


    @Operation(
            summary = "Eliminar producto",
            description = "Realiza un borrado lógico del producto."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Producto eliminado correctamente"),
            @ApiResponse(responseCode = "404", description = "Producto no encontrado")
    })
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        adminProductoService.eliminar(id);
    }


    @Operation(
        summary = "Restaurar producto",
        description = "Restaura un producto eliminado lógicamente."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Producto restaurado correctamente"),
            @ApiResponse(responseCode = "404", description = "Producto no encontrado")
    })
    @PatchMapping("/{id}/restaurar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void restaurar(@PathVariable Long id) {
        adminProductoService.restaurar(id);
    }


    @Operation(
        summary = "Ajustar precio por porcentaje",
        description = "Actualiza el precio de múltiples productos aplicando un porcentaje. " +
                "Usa un valor positivo para aumentar y negativo para disminuir."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Precios actualizados correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    @PatchMapping("/precios")
    public Map<String, Object> ajustarPrecios(
            @Valid @RequestBody ProductoAjustePrecioRequest request) {

        int actualizados = adminProductoService.ajustarPrecioPorPorcentaje(
                request.getIds(),
                request.getPorcentaje());

        return Map.of(
                "actualizados", actualizados,
                "porcentaje", request.getPorcentaje()
        );
    }


    @Operation(
        summary = "Subir imagen de producto",
        description = "Sube la imagen del producto y la establece como imagen principal."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Imagen subida correctamente"),
            @ApiResponse(responseCode = "400", description = "No se envió una imagen válida"),
            @ApiResponse(responseCode = "404", description = "Producto no encontrado")
    })
    @PostMapping(value = "/{id}/imagen", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProductoResponse subirImagen(
            @PathVariable Long id,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Debes subir una imagen.");
        }

        byte[] contenido;
        try {
            contenido = file.getBytes();
        } catch (IOException ex) {
            throw new BadRequestException("No se pudo leer la imagen subida.");
        }

        return adminProductoService.subirImagen(
                id,
                contenido,
                file.getContentType(),
                file.getOriginalFilename());
    }

}