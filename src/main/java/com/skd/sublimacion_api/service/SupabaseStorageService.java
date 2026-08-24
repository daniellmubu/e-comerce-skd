package com.skd.sublimacion_api.service;

import com.skd.sublimacion_api.exeption.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.UUID;

/**
 * Subida de archivos al bucket de Supabase Storage. Centraliza la lógica que
 * antes vivía en DisenoServiceImpl para que los diseños de IA y los diseños
 * subidos por el usuario compartan exactamente el mismo mecanismo de subida.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SupabaseStorageService {

    private final WebClient.Builder webClientBuilder;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service.key}")
    private String supabaseServiceKey;

    @Value("${supabase.storage.bucket}")
    private String supabaseBucket;

    private static final Duration TIMEOUT_SUBIDA = Duration.ofSeconds(30);

    /**
     * Sube una imagen al bucket y devuelve la URL pública de acceso.
     */
    public String subirImagen(byte[] imagenBytes, String extension, String contentType) {

        String nombreArchivo = UUID.randomUUID() + extension;
        String uploadUrl = supabaseUrl + "/storage/v1/object/"
                + supabaseBucket + "/" + nombreArchivo;

        WebClient client = webClientBuilder.build();

        try {
            client.post()
                    .uri(uploadUrl)
                    .header("Authorization", "Bearer " + supabaseServiceKey)
                    .header("apikey", supabaseServiceKey)
                    .header("Content-Type", contentType)
                    .bodyValue(imagenBytes)
                    .retrieve()
                    .toBodilessEntity()
                    .timeout(TIMEOUT_SUBIDA)
                    .block();
        } catch (RuntimeException ex) {
            log.error("Error al subir imagen a Supabase Storage", ex);
            throw new BadRequestException(
                    "No se pudo guardar la imagen del diseño. Intenta de nuevo.");
        }

        return supabaseUrl + "/storage/v1/object/public/"
                + supabaseBucket + "/" + nombreArchivo;
    }
}