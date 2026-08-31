-- Tabla de solicitudes de cambio de datos de usuario iniciadas por un
-- administrador.
--
-- MIGRACIÓN: ejecutar UNA sola vez en la base de datos (Supabase).
--
-- El cambio NO se aplica directamente: queda PENDIENTE hasta que el propio
-- usuario lo aprueba desde el enlace enviado a su correo (double opt-in).
-- El rol NO se edita desde el admin: sólo se asigna al crear el usuario.
--
-- Relación: cambio_pendiente.usuario_id -> usuario(id)

CREATE TABLE IF NOT EXISTS cambio_pendiente (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    usuario_id BIGINT NOT NULL,
    nombre VARCHAR(255),
    username VARCHAR(255),
    correo VARCHAR(255),
    telefono VARCHAR(50),
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    fecha_expiracion TIMESTAMP NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_respuesta TIMESTAMP,
    CONSTRAINT fk_cambio_pendiente_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

CREATE INDEX IF NOT EXISTS idx_cambio_pendiente_usuario
    ON cambio_pendiente(usuario_id);
