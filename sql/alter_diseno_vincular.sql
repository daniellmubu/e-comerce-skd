-- Vinculación de la entidad Diseno con ItemCarrito e ItemPedido.
--
-- DOCUMENTACIÓN: esta migración ya fue aplicada manualmente en Supabase.
-- NO ejecutar de nuevo. Se conserva solo como referencia del esquema.
--
-- Columnas agregadas (bigint, nullable):
--   item_carrito.diseno_id  -> diseno(id)
--   item_pedido.diseno_id   -> diseno(id)

-- 1) item_carrito.diseno_id
ALTER TABLE item_carrito ADD COLUMN IF NOT EXISTS diseno_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_item_carrito_diseno'
          AND conrelid = 'item_carrito'::regclass
    ) THEN
        ALTER TABLE item_carrito
            ADD CONSTRAINT fk_item_carrito_diseno
            FOREIGN KEY (diseno_id) REFERENCES diseno(id);
    END IF;
END $$;

-- 2) item_pedido.diseno_id
ALTER TABLE item_pedido ADD COLUMN IF NOT EXISTS diseno_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_item_pedido_diseno'
          AND conrelid = 'item_pedido'::regclass
    ) THEN
        ALTER TABLE item_pedido
            ADD CONSTRAINT fk_item_pedido_diseno
            FOREIGN KEY (diseno_id) REFERENCES diseno(id);
    END IF;
END $$;

-- Índices para las foreign keys
CREATE INDEX IF NOT EXISTS idx_item_carrito_diseno ON item_carrito(diseno_id);
CREATE INDEX IF NOT EXISTS idx_item_pedido_diseno ON item_pedido(diseno_id);
