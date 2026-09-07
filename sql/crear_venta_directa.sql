-- Venta directa: ventas registradas a mano por el administrador (mostrador,
-- WhatsApp, ferias) que NO pasan por la tienda online. Al crearla se descuenta
-- inventario; al cancelarla se devuelve el stock.
-- Idempotente: se ejecuta también desde schema.sql al arrancar la app.
-- estado: pendiente (por cobrar) | cobrada | cancelada

CREATE TABLE IF NOT EXISTS venta_directa (
    id BIGSERIAL PRIMARY KEY,
    nombre_cliente VARCHAR(160) NOT NULL,
    telefono VARCHAR(30),
    metodo_pago VARCHAR(30) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    nota TEXT,
    total NUMERIC(12,2) NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pagado_en TIMESTAMP,
    cancelado_en TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_venta_directa_estado ON venta_directa(estado);
CREATE INDEX IF NOT EXISTS idx_venta_directa_cliente ON venta_directa(nombre_cliente);

CREATE TABLE IF NOT EXISTS item_venta_directa (
    id BIGSERIAL PRIMARY KEY,
    venta_directa_id BIGINT NOT NULL REFERENCES venta_directa(id) ON DELETE CASCADE,
    producto_id BIGINT NOT NULL REFERENCES producto(id),
    variante_id BIGINT REFERENCES variante_producto(id),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL,
    detalle VARCHAR(255) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_item_venta_directa_venta ON item_venta_directa(venta_directa_id);

-- Clientes de ventas directas: se guardan para autocompletar (nombre/teléfono)
-- cuando el mismo comprador vuelve a hacer una venta de mostrador.
CREATE TABLE IF NOT EXISTS cliente_venta_directa (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(160) NOT NULL,
    telefono VARCHAR(30),
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cliente_venta_directa_nombre ON cliente_venta_directa(nombre);
CREATE INDEX IF NOT EXISTS idx_cliente_venta_directa_nombre_lower ON cliente_venta_directa(LOWER(nombre));

-- Referencia opcional al cliente persistido (ventas anteriores pueden no tenerlo).
ALTER TABLE venta_directa ADD COLUMN IF NOT EXISTS cliente_id BIGINT;
CREATE INDEX IF NOT EXISTS idx_venta_directa_cliente_id ON venta_directa(cliente_id);
