package com.skd.sublimacion_api.exeption;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import org.springframework.http.converter.HttpMessageNotReadableException;
import java.util.Arrays;
import com.skd.sublimacion_api.entity.Rol;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Recurso no encontrado
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleResourceNotFound(ResourceNotFoundException ex) {

         return buildError(
            HttpStatus.NOT_FOUND,
            "Not Found",
            ex.getMessage());
    }

    // Errores de negocio (validaciones, reglas, etc.)
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<?> handleBadRequest(BadRequestException ex) {

        return buildError(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                ex.getMessage());
    }

    // Acceso no autorizado al recurso (403)
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<?> handleForbidden(ForbiddenException ex) {

        return buildError(
                HttpStatus.FORBIDDEN,
                "Forbidden",
                ex.getMessage());
    }

    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<?> handleTooManyRequests(TooManyRequestsException ex) {
        return buildError(
                HttpStatus.TOO_MANY_REQUESTS,
                "Too Many Requests",
                ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException ex) {

         return buildError(
            HttpStatus.BAD_REQUEST,
            "Bad Request",
            ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<?> handleIllegalState(
            IllegalStateException ex) {

        return buildError(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                ex.getMessage());
    }

    // Errores de validación
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(
            MethodArgumentNotValidException ex) {

        Map<String, Object> error = new HashMap<>();

        Map<String, String> errores = new HashMap<>();

        ex.getBindingResult()
                .getFieldErrors()
                .forEach(fieldError ->
                        errores.put(
                                fieldError.getField(),
                                fieldError.getDefaultMessage()));

        error.put("timestamp", LocalDateTime.now());
        error.put("status", 400);
        error.put("error", "Bad Request");
        error.put("message", "Error de validación");
        error.put("fields", errores);

        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<?> handleMaxUploadSizeExceeded(
            MaxUploadSizeExceededException ex) {

        return buildError(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                "La imagen supera el tamaño máximo permitido (5 MB).");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex) {
        if (ex.getMessage() != null &&
                ex.getMessage().contains("Rol")) {

            return buildError(
                    HttpStatus.BAD_REQUEST,
                    "Bad Request",
                    "Rol inválido. Valores permitidos: "
                            + Arrays.toString(Rol.values()));
        }

        return buildError(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                "El cuerpo de la petición contiene datos inválidos.");
    }
    
    // Errores de autenticacion: credenciales invalidas deben responder 401, no 500.
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<?> handleAuthenticationException(AuthenticationException ex) {
        return buildError(
                HttpStatus.UNAUTHORIZED,
                "Unauthorized",
                "Credenciales inválidas");
    }
    
    // Cualquier otro error — nunca exponer detalles técnicos al cliente
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneral(Exception ex) {
        org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class)
                .error("Error no controlado", ex);
        return buildError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal Server Error",
                "Ocurrió un error. Inténtalo de nuevo más tarde.");
    }

    private ResponseEntity<Map<String, Object>> buildError(
            HttpStatus status,
            String error,
            String message) {

        Map<String, Object> body = new HashMap<>();

        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);

        return ResponseEntity.status(status).body(body);
    }
}