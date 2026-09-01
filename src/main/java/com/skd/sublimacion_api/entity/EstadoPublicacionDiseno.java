package com.skd.sublimacion_api.entity;

/**
 * Estado de moderación de un diseño publicado por un usuario.
 *
 * null (no publicado): el diseño es privado y solo lo ve su dueño.
 * PENDIENTE: el usuario lo envió a la galería pública, esperando revisión.
 * PUBLICADO: el admin lo aprobó y es visible para todos.
 * RECHAZADO: el admin lo rechazó (no cumple las normas); el dueño ve el motivo.
 * OCULTO: estuvo publicado pero el admin lo retiró (por denuncias o revisión).
 */
public enum EstadoPublicacionDiseno {
    PENDIENTE,
    PUBLICADO,
    RECHAZADO,
    OCULTO
}
