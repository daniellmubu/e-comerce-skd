-- Imagen representativa del tipo de empaque (para mostrar en la tienda y en el panel).
-- Idempotente: se ejecuta también desde schema.sql al arrancar la app.

ALTER TABLE empaque ADD COLUMN IF NOT EXISTS imagen_url TEXT;
