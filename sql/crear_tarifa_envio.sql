-- Tarifas de envío por departamento de Colombia.
--
-- El cálculo de envío se basa en direccion.departamento (string). Idempotente.

CREATE TABLE IF NOT EXISTS tarifa_envio (
    id             BIGSERIAL PRIMARY KEY,
    departamento   VARCHAR(100) NOT NULL UNIQUE,
    costo_base     NUMERIC(10, 2) NOT NULL,
    dias_estimados INTEGER NOT NULL
);