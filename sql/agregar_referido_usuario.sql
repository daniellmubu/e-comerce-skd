-- Referidos: cada usuario tiene un código único para invitar amigos.
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS codigo_referido VARCHAR(20) UNIQUE;
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS referido_por_id BIGINT REFERENCES usuario(id);
CREATE INDEX IF NOT EXISTS idx_usuario_referido_por ON usuario(referido_por_id);
