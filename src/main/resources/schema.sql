-- Migraciones idempotentes ejecutadas por Spring al arrancar (spring.sql.init.mode=always),
-- ANTES de que Hibernate valide el esquema (ddl-auto=validate).
-- Equivalen a sql/moderacion_resenas.sql: si ya se aplicaron, no hacen nada.

ALTER TABLE resena ADD COLUMN IF NOT EXISTS imagen_url TEXT;
ALTER TABLE resena ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'aprobada';

-- Verificación de email (tabla para los tokens de verificación).
CREATE TABLE IF NOT EXISTS email_verification_token (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    fecha_expiracion TIMESTAMP NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_uso TIMESTAMP
);
