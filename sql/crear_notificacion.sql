-- Tabla de notificaciones de usuario (bandeja de entrada).
--
-- MIGRACIÓN: ejecutar UNA sola vez en la base de datos (Supabase).
-- Es idempotente: si la tabla ya existe no hace nada.
--
-- Relación: notificacion.usuario_id -> usuario(id)

CREATE TABLE IF NOT EXISTS notificacion (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    tipo VARCHAR(60) NOT NULL,
    titulo VARCHAR(120),
    mensaje TEXT NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_notificacion_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

CREATE INDEX IF NOT EXISTS idx_notificacion_usuario
    ON notificacion(usuario_id);

-- Columna de título para notificaciones (idempotente).
ALTER TABLE notificacion ADD COLUMN IF NOT EXISTS titulo VARCHAR(120);
