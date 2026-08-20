-- Cupones únicos por usuario + cupón de bienvenida.
--
-- MIGRACIÓN: ejecutar manualmente en Supabase (SQL Editor) antes de arrancar
-- la app. spring.jpa.hibernate.ddl-auto=validate exige que la columna y la
-- tabla existan. Idempotente: puede ejecutarse varias veces.
--
-- 1) Nueva columna en cupon: es_unico_por_usuario (la tabla cupon solo tenía
--    UNIQUE(codigo) y la PK, no hay constraints CHECK que interfieran).
-- 2) Tabla cupon_usuario: relación cupon <-> usuario con estado de uso.

ALTER TABLE cupon ADD COLUMN IF NOT EXISTS es_unico_por_usuario BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS cupon_usuario (
    id BIGSERIAL PRIMARY KEY,
    cupon_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_uso TIMESTAMP,
    CONSTRAINT uk_cupon_usuario UNIQUE (cupon_id, usuario_id),
    CONSTRAINT fk_cupon_usuario_cupon FOREIGN KEY (cupon_id) REFERENCES cupon(id),
    CONSTRAINT fk_cupon_usuario_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

CREATE INDEX IF NOT EXISTS idx_cupon_usuario_usuario ON cupon_usuario(usuario_id);