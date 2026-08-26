-- Variantes de producto (talla/color/stock/precio)
CREATE TABLE IF NOT EXISTS variante_producto (
    id              BIGSERIAL PRIMARY KEY,
    producto_id     BIGINT       NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
    talla           VARCHAR(10)  NOT NULL,
    color           VARCHAR(50)  NOT NULL,
    precio          NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock           INTEGER      NOT NULL DEFAULT 0,
    sku             VARCHAR(50)  UNIQUE,
    creado_en       TIMESTAMP    NOT NULL DEFAULT now(),
    actualizado_en  TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_variante_producto ON variante_producto(producto_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_variante_producto_talla_color
    ON variante_producto (producto_id, talla, color);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_variante_actualizado_en'
    ) THEN
        CREATE TRIGGER trg_variante_actualizado_en
        BEFORE UPDATE ON variante_producto
        FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
    END IF;
END $$;