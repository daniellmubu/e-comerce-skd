package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.dto.referido.ReferidoInfoResponse;
import com.skd.sublimacion_api.entity.Usuario;
import com.skd.sublimacion_api.repository.UsuarioRepository;
import com.skd.sublimacion_api.service.ReferidoService;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
public class ReferidoServiceImpl implements ReferidoService {

    private final UsuarioRepository usuarioRepository;

    private static final String ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    @Transactional
    public ReferidoInfoResponse miCodigo(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (usuario.getCodigoReferido() == null || usuario.getCodigoReferido().isBlank()) {
            String codigo;
            int intentos = 0;
            do {
                codigo = generarCodigo(usuario.getUsername());
                intentos++;
                if (intentos > 10) throw new IllegalStateException("No se pudo generar código referido");
            } while (usuarioRepository.findByCodigoReferido(codigo).isPresent());
            usuario.setCodigoReferido(codigo);
            usuarioRepository.save(usuario);
        }

        long total = usuarioRepository.countByReferidoPorId(usuario.getId());

        return ReferidoInfoResponse.builder()
                .codigo(usuario.getCodigoReferido())
                .link(frontendUrl + "/registro?ref=" + usuario.getCodigoReferido())
                .totalReferidos(total)
                .recompensas(total) // 1 recompensa por referido, MVP
                .build();
    }

    private String generarCodigo(String username) {
        String base = username.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        base = base.length() >= 3 ? base.substring(0, 3) : String.format("%-3s", base).replace(' ', 'X');
        StringBuilder sb = new StringBuilder("SKD-").append(base).append("-");
        for (int i = 0; i < 4; i++) sb.append(ALFABETO.charAt(RANDOM.nextInt(ALFABETO.length())));
        return sb.toString();
    }
}