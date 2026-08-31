-- Amplía el CHECK de estado del pedido con los estados del flujo de producción
-- (imprimiendo y empacando), que ya usan el backend y el tablero kanban de
-- producción. Sin estos estados, la BD rechazaba el cambio desde Producción.
--
-- MIGRACIÓN: ejecutar UNA sola vez en la base de datos (Supabase).

ALTER TABLE pedido DROP CONSTRAINT IF EXISTS pedido_estado_check;

ALTER TABLE pedido ADD CONSTRAINT pedido_estado_check CHECK (
    estado IN (
        'recibido',
        'disenando',
        'imprimiendo',
        'empacando',
        'enviado',
        'entregado',
        'cancelado'
    )
);
