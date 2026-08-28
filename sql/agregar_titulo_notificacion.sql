-- Título corto para la notificación (además del mensaje).
-- Idempotente.

ALTER TABLE notificacion ADD COLUMN IF NOT EXISTS titulo VARCHAR(120);