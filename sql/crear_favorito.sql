-- Lista de deseos / favoritos por usuario.
--
-- Tabla de relación usuario <-> producto con UNIQUE(usuario_id, producto_id)
-- para que no se pueda duplicar un favorito. Idempotente.

CREATE TABLE IF NOT EXISTS favorito (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  BIGINT NOT NULL REFERENCES usuario(id),
    producto_id BIGINT NOT NULL REFERENCES producto(id),
    creado_en   TIMESTAMP NOT NULL DEFAULT now()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_favorito_usuario_producto'
    ) THEN
        ALTER TABLE favorito
            ADD CONSTRAINT uq_favorito_usuario_producto UNIQUE (usuario_id, producto_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_favorito_usuario ON favorito (usuario_id);