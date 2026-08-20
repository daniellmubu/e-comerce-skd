-- Tabla de tokens para recuperación de contraseña.
--
-- MIGRACIÓN: ya fue ejecutada no usar de nuevo.
--
-- Relación: password_reset_token.usuario_id -> usuario(id)

CREATE TABLE IF NOT EXISTS password_reset_token (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    usuario_id BIGINT NOT NULL,
    fecha_expiracion TIMESTAMP NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_uso TIMESTAMP,
    CONSTRAINT fk_password_reset_token_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token_usuario
    ON password_reset_token(usuario_id);