-- Migraciones idempotentes ejecutadas por Spring al arrancar (spring.sql.init.mode=always),
-- ANTES de que Hibernate valide el esquema (ddl-auto=validate).
-- Equivalen a sql/moderacion_resenas.sql: si ya se aplicaron, no hacen nada.

ALTER TABLE resena ADD COLUMN IF NOT EXISTS imagen_url TEXT;
ALTER TABLE resena ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'aprobada';
