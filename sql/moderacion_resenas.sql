-- Moderación de reseñas: foto opcional y estado de moderación.
-- Las reseñas existentes se marcan como 'aprobada' para no ocultarlas;
-- las nuevas nacen en 'pendiente' (lo define la entidad/servicio).
-- Idempotente. Ejecutar en Supabase antes de levantar la app
-- (ddl-auto=validate exige que las columnas existan).

ALTER TABLE resena ADD COLUMN IF NOT EXISTS imagen_url TEXT;
ALTER TABLE resena ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'aprobada';
