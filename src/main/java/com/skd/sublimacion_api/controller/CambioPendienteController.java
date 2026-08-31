package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.service.CambioPendienteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints públicos a los que apunta el correo de confirmación de cambio de
 * datos. El token es la credencial: sin él no se puede aprobar ni rechazar.
 */
@RestController
@RequestMapping("/api/usuarios/cambios")
@RequiredArgsConstructor
@Tag(
        name = "Confirmación de cambios de datos",
        description = "Aprobación/rechazo por parte del cliente de los cambios "
                + "de sus datos solicitados por un administrador."
)
public class CambioPendienteController {

    private final CambioPendienteService cambioPendienteService;

    @Operation(
        summary = "Aprobar cambio de datos",
        description = "Aplica los cambios de datos pendientes si el token es válido."
    )
    @GetMapping(value = "/aprobar", produces = MediaType.TEXT_HTML_VALUE)
    public String aprobar(@RequestParam String token) {

        try {
            String mensaje = cambioPendienteService.aprobar(token);
            return pagina("Cambio aprobado", mensaje, true);
        } catch (IllegalArgumentException e) {
            return pagina("No se pudo aprobar", e.getMessage(), false);
        }
    }

    @Operation(
        summary = "Rechazar cambio de datos",
        description = "Invalida la solicitud pendiente sin aplicar ningún cambio."
    )
    @GetMapping(value = "/rechazar", produces = MediaType.TEXT_HTML_VALUE)
    public String rechazar(@RequestParam String token) {

        try {
            String mensaje = cambioPendienteService.rechazar(token);
            return pagina("Cambio rechazado", mensaje, true);
        } catch (IllegalArgumentException e) {
            return pagina("No se pudo rechazar", e.getMessage(), false);
        }
    }

    private String pagina(String titulo, String mensaje, boolean exito) {

        String color = exito ? "#16a34a" : "#dc2626";

        return "<!DOCTYPE html>"
                + "<html lang=\"es\"><head><meta charset=\"UTF-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
                + "<title>" + titulo + " - SKD</title></head>"
                + "<body style=\"margin:0;font-family:Arial,sans-serif;background:#f3f4f6;"
                + "display:flex;align-items:center;justify-content:center;min-height:100vh;\">"
                + "<div style=\"max-width:480px;margin:24px;background:#ffffff;border-radius:16px;"
                + "padding:32px;box-shadow:0 10px 25px rgba(0,0,0,0.08);text-align:center;\">"
                + "<div style=\"width:56px;height:56px;border-radius:50%;background:" + color + ";"
                + "color:#ffffff;font-size:30px;line-height:56px;margin:0 auto 16px;\">"
                + (exito ? "&#10003;" : "&#9888;") + "</div>"
                + "<h1 style=\"font-size:22px;color:" + color + ";margin:0 0 12px;\">"
                + titulo + "</h1>"
                + "<p style=\"color:#374151;font-size:15px;line-height:1.6;\">"
                + mensaje + "</p>"
                + "</div></body></html>";
    }
}
