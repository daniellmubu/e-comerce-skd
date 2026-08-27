-- Variante seleccionada en cada ítem del carrito (talla/color/precio).
-- Idempotente.

ALTER TABLE item_carrito ADD COLUMN IF NOT EXISTS variante_id BIGINT REFERENCES variante_producto(id);
CREATE INDEX IF NOT EXISTS idx_item_carrito_variante ON item_carrito(variante_id);