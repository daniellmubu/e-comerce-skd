-- Días estimados de entrega guardados como snapshot histórico del pedido.
--
-- El costo de envío ya existía (pedido.costo_envio); solo falta la columna
-- de días. Idempotente. Los pedidos existentes quedan con NULL.

ALTER TABLE pedido ADD COLUMN IF NOT EXISTS dias_estimados_entrega INTEGER;