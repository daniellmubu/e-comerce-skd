package com.skd.sublimacion_api.service.impl;

import com.skd.sublimacion_api.entity.SuscripcionNewsletter;
import com.skd.sublimacion_api.repository.SuscripcionNewsletterRepository;
import com.skd.sublimacion_api.service.NewsletterService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NewsletterServiceImpl implements NewsletterService {

    private final SuscripcionNewsletterRepository suscripcionNewsletterRepository;

    @Override
    public void suscribir(String correo) {

        // Idempotente: si ya está suscrito, no hacemos nada (respuesta genérica).
        if (suscripcionNewsletterRepository.existsByCorreo(correo)) {
            return;
        }

        suscripcionNewsletterRepository.save(SuscripcionNewsletter.builder()
                .correo(correo)
                .build());
    }
}
