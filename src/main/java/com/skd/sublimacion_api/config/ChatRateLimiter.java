package com.skd.sublimacion_api.config;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Component
public class ChatRateLimiter {

    private static final int MAX_MENSAJES = 8;
    private static final Duration VENTANA = Duration.ofMinutes(1);

    private final ConcurrentHashMap<String, Deque<Instant>> registros = new ConcurrentHashMap<>();

    /**
     * Ventana deslizante en memoria: máx. 8 mensajes por minuto por IP.
     * En memoria a propósito (una sola instancia); si el backend escala a
     * varias instancias, mover a un store compartido (Redis).
     *
     * @return true si el mensaje es permitido, false si excede el límite
     */
    public boolean tryConsume(String ip) {
        Deque<Instant> deque = registros.computeIfAbsent(ip, k -> new ConcurrentLinkedDeque<>());
        Instant ahora = Instant.now();
        Instant limite = ahora.minus(VENTANA);

        // Limpiar entradas fuera de la ventana
        while (!deque.isEmpty() && deque.peekFirst().isBefore(limite)) {
            deque.pollFirst();
        }

        if (deque.size() >= MAX_MENSAJES) {
            return false;
        }

        deque.addLast(ahora);
        return true;
    }
}
