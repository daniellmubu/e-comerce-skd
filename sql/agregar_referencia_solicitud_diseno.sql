-- Imagen de referencia que el cliente adjunta a su solicitud de diseño
-- (para que el diseñador vea su idea). Idempotente.

ALTER TABLE solicitud_diseno ADD COLUMN IF NOT EXISTS referencia_imagen_url TEXT;