-- Reseñas de productos: un usuario solo puede reseñar cada producto una vez.
--
-- La tabla resena ya existe (producto_id, usuario_id, calificacion CHECK 1-5,
-- comentario, creado_en). Solo falta la constraint UNIQUE que garantiza la
-- regla de negocio. Idempotente: puede ejecutarse varias veces.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_resena_producto_usuario'
    ) THEN
        ALTER TABLE resena
            ADD CONSTRAINT uq_resena_producto_usuario UNIQUE (producto_id, usuario_id);
    END IF;
END $$;