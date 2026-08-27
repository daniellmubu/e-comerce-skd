-- Variantes de producto (talla / color / stock / precio opcional).
-- Si 'precio' es NULL se usa el precio base del producto.
-- Idempotente. Ejecutar en Supabase antes de levantar la app
-- (ddl-auto=validate exige que la tabla exista).

CREATE TABLE IF NOT EXISTS variante (
    id          BIGSERIAL PRIMARY KEY,
    producto_id BIGINT NOT NULL REFERENCES producto(id),
    talla       VARCHAR(50),
    color       VARCHAR(50),
    stock       INTEGER NOT NULL DEFAULT 0,
    precio      NUMERIC(10,2),
    activo      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_variante_producto ON variante(producto_id);
