package com.skd.sublimacion_api.controller;

import com.skd.sublimacion_api.config.ChatRateLimiter;
import com.skd.sublimacion_api.dto.chat.ChatRequest;
import com.skd.sublimacion_api.dto.chat.ChatResponse;
import com.skd.sublimacion_api.exeption.TooManyRequestsException;
import com.skd.sublimacion_api.service.ChatBotService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatBotService chatBotService;
    private final ChatRateLimiter chatRateLimiter;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @Valid @RequestBody ChatRequest request,
            HttpServletRequest httpRequest) {

        String ip = extraerIp(httpRequest);

        if (!chatRateLimiter.tryConsume(ip)) {
            throw new TooManyRequestsException(
                    "Has enviado demasiados mensajes. Espera un momento e inténtalo de nuevo.");
        }

        ChatResponse response = chatBotService.responder(request);
        return ResponseEntity.ok(response);
    }

    private String extraerIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // X-Forwarded-For puede contener lista: "client, proxy1, proxy2"
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
