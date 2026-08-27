-- Galería de plantillas prediseñadas para el personalizador.
--
-- El usuario puede arrancar su diseño desde una plantilla en vez de empezar
-- en blanco. La gestión (crear/editar) se hace por ahora directo en BD:
-- solo existe lectura pública vía GET /api/plantillas.
--
-- producto_tipo_compatible: 'camiseta' | 'mug' | 'ambos'
-- Idempotente: la tabla y las filas de ejemplo solo se crean si no existen.

CREATE TABLE IF NOT EXISTS plantilla (
    id                       BIGSERIAL PRIMARY KEY,
    nombre                   VARCHAR(120) NOT NULL,
    categoria                VARCHAR(80)  NOT NULL,
    imagen_url               TEXT         NOT NULL,
    producto_tipo_compatible VARCHAR(20)  NOT NULL DEFAULT 'ambos',
    activo                   BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_plantilla_categoria ON plantilla (categoria);
CREATE INDEX IF NOT EXISTS idx_plantilla_activo ON plantilla (activo);

-- ------------------------------------------------------------------
-- Datos de ejemplo (reemplazar imagen_url por los diseños reales).
-- Las URLs son placeholders de placehold.co para probar el flujo completo.
-- ------------------------------------------------------------------

INSERT INTO plantilla (nombre, categoria, imagen_url, producto_tipo_compatible)
SELECT * FROM (VALUES
    ('Feliz Cumpleanos',   'Fechas especiales', 'https://placehold.co/800x800/png?text=Feliz%20Cumplea%C3%B1os',        'ambos'),
    ('Navidad SKD',        'Fechas especiales', 'https://placehold.co/800x800/png?text=Navidad%20SKD',                  'camiseta'),
    ('Dia de la Madre',    'Fechas especiales', 'https://placehold.co/800x800/png?text=Dia%20de%20la%20Madre',          'mug'),
    ('Cafe con Actitud',   'Frases',            'https://placehold.co/800x800/png?text=Cafe%20con%20Actitud',           'mug'),
    ('Hecho a Mano',       'Frases',            'https://placehold.co/800x800/png?text=Hecho%20a%20Mano',               'ambos'),
    ('Equipo Ganador',     'Deportes',          'https://placehold.co/800x800/png?text=Equipo%20Ganador',               'camiseta'),
    ('Lobo Salvaje',       'Animales',          'https://placehold.co/800x800/png?text=Lobo%20Salvaje',                 'camiseta'),
    ('Gato Minimalista',   'Animales',          'https://placehold.co/800x800/png?text=Gato%20Minimalista',             'mug')
) AS datos(nombre, categoria, imagen_url, producto_tipo_compatible)
WHERE NOT EXISTS (
    SELECT 1 FROM plantilla p WHERE p.nombre = datos.nombre
);
