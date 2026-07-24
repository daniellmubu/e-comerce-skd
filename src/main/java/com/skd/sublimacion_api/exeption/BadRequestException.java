package com.skd.sublimacion_api.exeption;

public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }

}