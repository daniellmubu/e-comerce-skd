# Mejoras pendientes — SKD Creando Sueños

> Archivo de referencia de trabajo para acumular mejoras del backend (`sublimacion-api`)
> y del panel administrativo (`frontend-admin`). Se depura cada vez que una mejora se
> resuelve; lo que ya está solucionado se elimina de esta lista.

---

## 1. Seguridad

- [ ] **Sin token en rutas protegidas devuelve 403, no 401**: `SecurityConfig` no configura
  `AuthenticationEntryPoint` (ni `AccessDeniedHandler`), así que "no autenticado" y "sin permisos"
  devuelven lo mismo. Nota: el handler de `AuthenticationException` ya responde 401
  ([`GlobalExceptionHandler.java`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/exeption/GlobalExceptionHandler.java:126)),
  pero el flujo de filtros de Spring Security intercepta antes.
- [ ] **`spring-dotenv` no carga el `.env` con Spring Boot 4.1.0**: dependencia
  `me.paulschwarz:spring-dotenv:4.0.0` en `pom.xml` no resuelve los placeholders
  (`Could not resolve placeholder 'SUPABASE_SERVICE_KEY'`). Hoy se mitiga cargando el `.env`
  manualmente con [`run-backend.cmd`](e-comerce-skd/run-backend.cmd:4). Verificar compatibilidad
  o documentar oficialmente el arranque con variables de entorno.
- [ ] **`JwtService` usa API deprecada de jjwt**: `signWith(getSignInKey())` en
  [`JwtService.java`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/security/JwtService.java:42)
  está deprecado en jjwt 0.13.0 (migrar a `signWith(key, SecureDigestAlgorithm)`).
- [ ] **`WompiService` usa casts unchecked**: `(Map<String, Object>) respuesta.get("data")` y
  `getResponseBodyAs(Map.class)` en [`WompiService.java`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/service/WompiService.java:99)
  generan warnings. Tipar con DTOs/`ParameterizedTypeReference`.
- [ ] **CORS hardcodeado a localhost**: [`SecurityConfig.java`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/config/SecurityConfig.java:68)
  fija `http://localhost:3000/5173`. En producción hay que mover los orígenes permitidos a una
  variable de entorno.
- [ ] **No hay endpoint de refresh token**: el frontend-admin [`axios.js`](e-comerce-skd/frontend-admin/src/api/axios.js:28)
  comenta que el backend no renueva token y fuerza re-login. Implementar refresh para no cerrar la
  sesión del admin a las 24h (y aplicarlo también al frontend público).
- [ ] **Sin protección contra fuerza bruta en login**: el `Usuario` tiene `intentosFallidos` y
  `bloqueado`, pero solo se usan en el panel admin ([`AdminUsuarioServiceImpl.java`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/service/impl/admin/AdminUsuarioServiceImpl.java:79));
  el login no los incrementa ni bloquea. Implementar bloqueo tras N intentos.
- [ ] **`@ExceptionHandler(Exception.class)` expone detalles internos**: devuelve
  `ex.getMessage()` en respuestas 500 ([`GlobalExceptionHandler.java`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/exeption/GlobalExceptionHandler.java:135)),
  lo que puede filtrar información sensible. Devolver un mensaje genérico y loguear el detalle.

## 2. Rendimiento / Calidad

- [ ] **Serialización de `PageImpl`**: warning de Spring Data ("Serializing PageImpl instances as-is
  is not supported"). Recomendación: `@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)`
  o `PagedModel` para una estructura JSON estable.
- [ ] **`spring.jpa.show-sql=true` activo**: útil en desarrollo, pero en producción debe
  desactivarse (volumen de logs y rendimiento) — [`application.properties`](e-comerce-skd/src/main/resources/application.properties:15).
- [ ] **N+1 en pedidos**: `convertir()` y `convertirKanban()` de
  [`AdminPedidoServiceImpl.java`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/service/impl/admin/AdminPedidoServiceImpl.java:100)
  consultan los ítems pedido por pedido. Usar fetch en lote (JPQL `JOIN FETCH`/`@EntityGraph`).
- [ ] **Kanban sin límite**: `GET /api/admin/pedidos/kanban` carga todos los pedidos en producción.
  Agregar límite configurable o paginación para tableros grandes.
- [ ] **Faltan índices para filtros frecuentes**: conviene índice en `pedido(estado)` (kanban/listado)
  y `resena(estado)` (moderación) en Supabase.
- [ ] **Cobertura de tests casi nula**: solo existe el test de contexto
  [`SublimacionApiApplicationTests.java`](e-comerce-skd/src/test/java/com/skd/sublimacion_api/SublimacionApiApplicationTests.java).
  Escribir tests unitarios de servicios y de integración de los controllers admin (variantes,
  moderación de reseñas, kanban, pedidos).
- [ ] **`DataInitializer` crea datos de prueba en cualquier entorno**: limitarlo a perfiles
  `dev`/`local` para no sembrar catálogo de prueba en producción.

## 3. Variantes (CRUD admin alineado a `VarianteProducto`)

> Nota: el equipo ya definió la entidad canónica `VarianteProducto` (talla/color/precio/stock/sku),
> la integró al carrito (`item_carrito.variante_id`) y publicó `GET /api/productos/{id}/variantes`.
> El CRUD del panel admin (`/api/admin/variantes`) opera sobre esa misma entidad.

- [ ] **Persistir la variante en `ItemPedido`**: el pedido aún no guarda qué talla/color se compró;
  mostrarla en el detalle de pedido, factura y panel admin.
- [ ] **Descontar stock de la variante** al confirmar el pedido y validar disponibilidad antes de
  pagar (evitar ventas sin stock).
- [ ] **Selector de talla/color en el catálogo público** (`DetalleProducto`/`ProductCard`) usando
  `GET /api/productos/{id}/variantes`.
- [ ] **Coherencia de stock**: definir si `producto.stock` es la suma de las variantes o un valor
  independiente, y mantenerlo consistente al crear/editar variantes.

## 4. Moderación de reseñas (CRUD de moderación implementado en panel admin)

- [ ] **Notificar por email** al cliente cuando su reseña es aprobada o rechazada (hay `EmailService`).
- [ ] **Filtro por producto/usuario** en el panel de moderación (hoy solo por estado).
- [ ] **Motivo de rechazo opcional**: permitir al admin dejar una razón y mostrarla al usuario.
- [ ] **UX pública**: decidir si las reseñas en estado `pendiente` muestran "en moderación" al autor,
  y verificar que el detalle de producto use los promedios solo de aprobadas (ya filtrado en backend).

## 5. Producción / Kanban (tablero implementado en panel admin)

- [ ] **Historial de estados**: el frontend público llama a `GET /pedidos/{id}/historial`
  ([`historialPedidoService.js`](e-comerce-skd/frontend/src/services/historialPedidoService.js:4))
  pero no existe ese endpoint en el backend. Implementar tabla de historial (auditoría de cambios
  de estado) o eliminar el servicio huérfano.
- [ ] **Cancelar desde el tablero**: hoy el kanban solo mueve entre estados de producción; agregar
  acción de cancelar (con confirmación).
- [ ] **Guía de envío al pasar a "enviado"**: capturar la guía desde el kanban antes de mover a
  "enviado" (el campo `guiaEnvio` ya existe en `Pedido`).
- [ ] **Tiempo real para el admin**: suscribir el panel a WebSocket para ver pedidos nuevos sin
  refresco manual (hoy solo el cliente recibe eventos de estado).

## 6. Operativo / DevOps

- [ ] **Migraciones SQL pendientes (`ddl-auto=validate`)**: antes de levantar la app hay que
  ejecutar en Supabase (idempotentes) los scripts acumulados del repo:
  - `sql/crear_variante_producto.sql` — tabla `variante_producto` (variantes canónicas).
  - `sql/agregar_variante_item_carrito.sql` — columna `variante_id` en `item_carrito`.
  - `sql/crear_plantilla.sql` — tabla `plantilla`.
  - `sql/limpiar_plantilla_columnas_heredadas.sql` — limpieza de columnas de plantilla.
  - `sql/moderacion_resenas.sql` — columnas `imagen_url` y `estado` en `resena`.
- [ ] **`.env.example` está vacío**: documentar todas las variables requeridas
  (`DB_PASSWORD`, `JWT_SECRET`, `SUPABASE_SERVICE_KEY`, `WOMPI_*`, `GMAIL_*`, `CLOUDFLARE_*`,
  `VITE_API_URL`) para facilitar el onboarding y el despliegue.
- [ ] **Contraseña del usuario `admin` en Supabase desconocida**: [`DataInitializer.java`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/config/DataInitializer.java:64)
  solo crea el admin si no existe (`Admin123*`); el existente conserva otra contraseña. Definir un
  procedimiento seguro para restablecerla (sin sobreescribir en cada arranque).
- [ ] **Evaluar migraciones versionadas** (Flyway/Liquibase) en lugar de scripts SQL manuales, para
  que el esquema avance junto al código.
