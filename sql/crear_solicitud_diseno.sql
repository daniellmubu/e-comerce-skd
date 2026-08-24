-- Solicitudes de diseño asistido por una persona real de SKD (diseñador).
--
-- Flujo: RECIBIDA -> EN_DISENO -> PROPUESTA_ENVIADA
--   -> (cliente aprueba)  LISTA_PARA_PRODUCCION
--   -> (cliente pide cambios) CAMBIOS_SOLICITADOS -> EN_DISENO -> ...
--
-- El diseño final aprobado se guarda en `diseno` con origen = CONTACTO_EMPRESA.
-- Idempotente.

CREATE TABLE IF NOT EXISTS solicitud_diseno (
    id                    BIGSERIAL PRIMARY KEY,
    usuario_id            BIGINT NOT NULL REFERENCES usuario(id),
    producto_id           BIGINT NOT NULL REFERENCES producto(id),
    descripcion           TEXT NOT NULL,
    estado                VARCHAR(30) NOT NULL,
    propuesta_imagen_url  TEXT,
    mensaje_admin         TEXT,
    motivo_cambios        TEXT,
    diseno_id             BIGINT REFERENCES diseno(id),
    creado_en             TIMESTAMP NOT NULL DEFAULT now(),
    actualizado_en        TIMESTAMP
);