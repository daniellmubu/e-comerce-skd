package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.service.CuentaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cuenta")
@RequiredArgsConstructor
public class CuentaController {

    private final CuentaService cuentaService;

    @PostMapping("/solicitar-cancelacion")
    public ResponseEntity<Map<String, String>> solicitarCancelacion(
            @AuthenticationPrincipal Usuario usuario) {
        cuentaService.solicitarCancelacion(usuario.getId());
        return ResponseEntity.ok(Map.of(
                "message", "Te enviamos un código de 6 dígitos a " + enmascararCorreo(usuario.getCorreo()) + ". Es válido por 15 minutos."));
    }

    @PostMapping("/verificar-codigo-cancelacion")
    public ResponseEntity<Map<String, String>> verificarCodigo(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody Map<String, String> body) {
        String codigo = body.get("codigo");
        if (codigo == null || codigo.isBlank()) {
            throw new IllegalArgumentException("El código es obligatorio");
        }
        cuentaService.verificarCodigo(usuario.getId(), codigo.trim());
        return ResponseEntity.ok(Map.of("message", "Código verificado. Ahora confirma la eliminación definitiva."));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> eliminarCuenta(
            @AuthenticationPrincipal Usuario usuario) {
        cuentaService.eliminarCuenta(usuario.getId());
        return ResponseEntity.ok(Map.of("message", "Tu cuenta ha sido eliminada permanentemente"));
    }

    private String enmascararCorreo(String correo) {
        if (correo == null || !correo.contains("@")) return correo;
        String[] partes = correo.split("@", 2);
        String local = partes[0];
        if (local.length() <= 2) return correo;
        return local.substring(0, 2) + "***@" + partes[1];
    }
}
