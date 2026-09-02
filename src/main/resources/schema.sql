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

-- Galería pública de diseños creados por usuarios (moderación + métricas).
-- estado_publicacion: null (no publicado) | PENDIENTE | PUBLICADO | RECHAZADO | OCULTO
ALTER TABLE diseno ADD COLUMN IF NOT EXISTS titulo VARCHAR(120);
ALTER TABLE diseno ADD COLUMN IF NOT EXISTS estado_publicacion VARCHAR(20);
ALTER TABLE diseno ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT;
ALTER TABLE diseno ADD COLUMN IF NOT EXISTS veces_usado INTEGER NOT NULL DEFAULT 0;
ALTER TABLE diseno ADD COLUMN IF NOT EXISTS publicado_en TIMESTAMP;

-- "Me gusta" de los usuarios hacia los diseños publicados.
CREATE TABLE IF NOT EXISTS diseno_me_gusta (
    id BIGSERIAL PRIMARY KEY,
    diseno_id BIGINT NOT NULL REFERENCES diseno(id) ON DELETE CASCADE,
    usuario_id BIGINT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_diseno_usuario UNIQUE (diseno_id, usuario_id)
);
CREATE INDEX IF NOT EXISTS idx_diseno_me_gusta_diseno ON diseno_me_gusta(diseno_id);

-- Sesiones activas: control de dispositivos con la sesión abierta y cierre
-- remoto de sesiones (jwt jti emitidos). Una sesión queda revocada al cerrar
-- sesión o desde el panel admin (Seguridad -> Sesiones activas).
CREATE TABLE IF NOT EXISTS sesion_activa (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    token_jti VARCHAR(64) NOT NULL UNIQUE,
    user_agent TEXT,
    ip VARCHAR(64),
    dispositivo VARCHAR(120),
    navegador VARCHAR(160),
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_en TIMESTAMP NOT NULL,
    revocada BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_sesion_activa_usuario ON sesion_activa(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sesion_activa_jti ON sesion_activa(token_jti);
