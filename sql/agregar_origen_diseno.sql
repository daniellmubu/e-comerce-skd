-- Origen del diseño: 'IA' (generado por Cloudflare) o 'USUARIO' (subido desde
-- el editor). Los registros existentes son de IA, por eso el default es 'IA'.
-- Idempotente.

ALTER TABLE diseno ADD COLUMN IF NOT EXISTS origen VARCHAR(20) NOT NULL DEFAULT 'IA';