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

import com.skd.sublimacion_api.dto.pedido.PedidoRequest;
import com.skd.sublimacion_api.dto.pedido.PedidoResponse;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.service.PedidoService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;

    @GetMapping("/{id}")
    public PedidoResponse obtener(@PathVariable Long id,
                                  @AuthenticationPrincipal Usuario usuario) {
        return pedidoService.obtenerPorId(id, usuario.getId());
    }

    @GetMapping("/usuario")
    public List<PedidoResponse> listarPorUsuario(@AuthenticationPrincipal Usuario usuario) {
        return pedidoService.listarPorUsuario(usuario.getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PedidoResponse guardar(@RequestBody PedidoRequest request,
                                  @AuthenticationPrincipal Usuario usuario) {
        return pedidoService.guardar(request, usuario.getId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id,
                         @AuthenticationPrincipal Usuario usuario) {
        pedidoService.eliminar(id, usuario.getId());
    }

}