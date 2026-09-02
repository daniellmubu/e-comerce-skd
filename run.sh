#!/usr/bin/env bash
# Arranca el backend cargando las variables del .env local.
# Solo para desarrollo local; en el despliegue las variables se
# configuran en la plataforma (Render/Railway), no con este script.
set -e
cd "$(dirname "$0")"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

exec ./mvnw spring-boot:run "$@"
