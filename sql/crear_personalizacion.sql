-- Personalización de cada ítem del carrito.
--
-- Guarda cómo el usuario dejó configurado su producto antes de añadirlo al
-- carrito: la imagen del diseño (IA o subida), la descripción (que incluye el
-- texto, su color, tamaño y posición), la rotación, la escala y el costo extra
-- por personalizar. Idempotente.

CREATE TABLE IF NOT EXISTS personalizacion (
    id              BIGSERIAL PRIMARY KEY,
    item_carrito_id BIGINT NOT NULL REFERENCES item_carrito(id),
    imagen_url      TEXT,
    texto           TEXT,
    rotacion        INTEGER,
    escala          DOUBLE PRECISION,
    costo_adicional NUMERIC(10, 2) DEFAULT 0
);

-- Un ítem del carrito no puede tener más de una personalización.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_personalizacion_item_carrito'
    ) THEN
        ALTER TABLE personalizacion
            ADD CONSTRAINT uq_personalizacion_item_carrito UNIQUE (item_carrito_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_personalizacion_item_carrito
    ON personalizacion (item_carrito_id);
