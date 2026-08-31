package com.skd.sublimacion_api.entity;

/**
 * Estados de una solicitud de cambio de datos de usuario iniciada por un
 * administrador. El cambio sólo se aplica cuando el propio usuario lo aprueba
 * desde el correo (doble confirmación / double opt-in).
 */
public enum EstadoCambioPendiente {
    PENDIENTE,
    APROBADO,
    RECHAZADO,
    EXPIRADO
}
