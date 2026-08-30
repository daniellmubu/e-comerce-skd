package com.skd.sublimacion_api;

import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.mail.javamail.JavaMailSender;

/**
 * Configuración de test que sustituye beans de servicios externos
 * (correo, etc.) por mocks, para poder arrancar el contexto completo
 * sin depender de SMTP, almacenamiento o pasarelas reales.
 */
@TestConfiguration
public class TestMockConfiguration {

    @Bean
    public JavaMailSender javaMailSender() {
        return Mockito.mock(JavaMailSender.class);
    }
}