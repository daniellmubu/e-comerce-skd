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

    // Acceso no autorizado al recurso (403)
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<?> handleForbidden(ForbiddenException ex) {

        return buildError(
                HttpStatus.FORBIDDEN,
                "Forbidden",
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
    
    // Cualquier otro error
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneral(Exception ex) {

        return buildError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal Server Error",
                ex.getMessage());
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