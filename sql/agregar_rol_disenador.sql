-- Agrega el rol 'disenador' al check constraint de usuario.rol.
-- Idempotente: elimina y recrea la restricción con los tres roles.

ALTER TABLE usuario DROP CONSTRAINT IF EXISTS usuario_rol_check;
ALTER TABLE usuario ADD CONSTRAINT usuario_rol_check
    CHECK (rol IN ('cliente', 'admin', 'disenador'));