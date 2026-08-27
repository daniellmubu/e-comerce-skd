-- Limpieza de la tabla plantilla: elimina columnas heredadas de un diseño
-- anterior que NUNCA existió en este código (verificado en todo el histórico
-- git: nunca hubo entidad Plantilla ni migración con estas columnas).
--
--   categoria_id  (bigint, NOT NULL, posible FK a categoria)
--   ocasion       (NOT NULL)
--   es_publica    (NOT NULL)
--   archivo_url   (NOT NULL)
--
-- La galería del personalizador usa únicamente:
--   nombre, categoria, imagen_url, producto_tipo_compatible, activo
-- (entidad Plantilla + GET /api/plantillas).
--
-- El app corre con ddl-auto=validate: Hibernate valida que las columnas
-- mapeadas EXISTAN, pero ignora columnas extra; borrar las viejas no lo
-- afecta. Idempotente (se puede ejecutar varias veces).

-- Por si la columna vieja tenía una FK hacia categoria.
ALTER TABLE plantilla DROP CONSTRAINT IF EXISTS fk_plantilla_categoria;
ALTER TABLE plantilla DROP CONSTRAINT IF EXISTS fk_plantilla_categoria_id;

ALTER TABLE plantilla DROP COLUMN IF EXISTS categoria_id;
ALTER TABLE plantilla DROP COLUMN IF EXISTS ocasion;
ALTER TABLE plantilla DROP COLUMN IF EXISTS es_publica;
ALTER TABLE plantilla DROP COLUMN IF EXISTS archivo_url;

-- Verificación rápida tras ejecutar:
--   SELECT column_name, is_nullable FROM information_schema.columns
--   WHERE table_name = 'plantilla' ORDER BY ordinal_position;
