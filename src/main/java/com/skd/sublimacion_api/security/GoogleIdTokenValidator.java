package com.skd.sublimacion_api.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.skd.sublimacion_api.exeption.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Collections;

/**
 * Valida el ID token de "Ingresar con Google" que llega desde el frontend.
 *
 * La verificación SIEMPRE se hace en el servidor contra las claves públicas
 * de Google (JWKS): nunca se confía en el token que manda el navegador.
 */
@Component
@Slf4j
public class GoogleIdTokenValidator {

    private final String clientId;

    public GoogleIdTokenValidator(@Value("${google.client.id:}") String clientId) {
        this.clientId = clientId;
    }

    /**
     * Verifica el token y devuelve el perfil si es válido y el correo está
     * verificado por Google. Lanza excepción en cualquier caso inválido.
     */
    public PerfilGoogle validar(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new BadRequestException("Token de Google no proporcionado.");
        }
        if (clientId == null || clientId.isBlank()) {
            throw new IllegalStateException(
                    "El ingreso con Google no está configurado (falta GOOGLE_CLIENT_ID).");
        }

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(clientId))
                    .build();

            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                throw new BadRequestException("El token de Google es inválido o expiró.");
            }

            GoogleIdToken.Payload payload = token.getPayload();

            Boolean emailVerificado = payload.getEmailVerified();
            if (!Boolean.TRUE.equals(emailVerificado)) {
                throw new BadRequestException("Google no confirmó el correo de esa cuenta.");
            }

            String email = payload.getEmail();
            if (email == null || email.isBlank()) {
                throw new BadRequestException("La cuenta de Google no tiene correo asociado.");
            }

            return new PerfilGoogle(email, (String) payload.get("name"), (String) payload.get("picture"));
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Fallo al verificar token de Google: {}", e.getMessage());
            throw new BadRequestException("No se pudo validar el ingreso con Google. Intenta de nuevo.");
        }
    }

    /** Datos mínimos del usuario extraídos del ID token verificado. */
    public record PerfilGoogle(String email, String nombre, String picture) {
    }
}
