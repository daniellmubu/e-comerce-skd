# Mejoras pendientes — SKD Creando Sueños

> Archivo de referencia de trabajo para acumular mejoras del backend (`sublimacion-api`)
> y del panel administrativo (`frontend-admin`). Se depura cada vez que una mejora se
> resuelve; lo que ya está solucionado se elimina de esta lista.

---

## 0. Inventario / stock (implementado 2026-09-07)

> Paquete "stock consistente y completo": un único servicio de inventario, liberación de reservas
> cuando el pago no se concreta y stock agregado correcto en el panel admin.

### Implementado

- [x] **Servicio único de inventario** [`InventarioService`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/service/InventarioService.java)
  con `reservar`, `reponer`, `reponerPedido` y `reservarPedido` (bloqueo pesimista + descuento
  atómico). Centraliza la lógica que antes estaba duplicada en `CheckoutServiceImpl` y
  `PedidoServiceImpl`.
- [x] **Checkout usa el servicio**: [`CheckoutServiceImpl`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/service/impl/CheckoutServiceImpl.java:88)
  delega el descuento de stock en `inventarioService.reservar(...)`. Se eliminó el método duplicado.
- [x] **Stock agregado en admin**: al vender una variante baja la columna "Stock" de la lista de
  productos. `GET/POST/PUT /api/admin/productos` exponen `stockEfectivo` (suma de variantes si el
  producto tiene) y `tieneVariantes`. [`ProductoMapper`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/mapper/ProductoMapper.java)
  no cambió su comportamiento público.
- [x] **Liberación de reserva en rechazos**: [`WompiWebhookController`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/controller/WompiWebhookController.java:74),
  `simularTarjeta` y `consultarEstadoPago` de [`PagoServiceImpl`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/service/impl/PagoServiceImpl.java:62)
  reponen el stock cuando el pago pasa de "pendiente" a rechazado/voided/error.
- [x] **Expiración automática de reservas**: [`ExpiracionPagoJob`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/config/ExpiracionPagoJob.java)
  libera el stock y cancela el pedido de pagos online "pendiente" vencidos
  (`app.expiracion-pago.minutos=30`, barrido cada `60000 ms`). La contraentrega no expira sola.
- [x] **Reintento tras expiración/rechazo**: `iniciarPagoWompi` re-reserva el stock y reactiva el
  pedido cancelado antes de generar una nueva transacción.
- [x] **Frontend admin** [`Productos.jsx`](e-comerce-skd/frontend-admin/src/pages/Productos.jsx): la
  columna Stock muestra el efectivo con la etiqueta "por variantes" y, al editar un producto con
  variantes, se oculta la edición manual del stock global (se gestiona en "Variantes").
- [x] **Frontend público** [`CheckoutPago.jsx`](e-comerce-skd/frontend/src/pages/CheckoutPago.jsx)
  reconoce el estado "expirado" del pago y lo comunica al cliente.

### Pendiente / nota

- [ ] **Caso borde webhook tardío**: si un pago se aprueba en Wompi después de que el job expiró la
  reserva (pedido ya "cancelado"), el webhook marca el pago "aprobado" pero no reactiva el pedido.
  Revisar manualmente ese pedido (o implementar re-reserva en el webhook aprobado).
- [ ] **Historial de stock**: no se guarda auditoría de movimientos de inventario (reserva,
  liberación, ajuste manual). Útil para conciliar y auditar.

---

## 0b. Venta directa (implementado 2026-09-07)

> Módulo para que el admin registre ventas hechas fuera de la tienda online (mostrador,
> WhatsApp, ferias) manteniendo el inventario consistente. Vive en tablas propias y NO
> entra al kanban/producción.

### Implementado

- [x] **Tablas propias**: `venta_directa` e `item_venta_directa` creadas en
  [`schema.sql`](e-comerce-skd/src/main/resources/schema.sql) y espejo en
  [`sql/crear_venta_directa.sql`](e-comerce-skd/sql/crear_venta_directa.sql). No toca `pedido`.
- [x] **Backend**: entidades [`VentaDirecta`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/entity/VentaDirecta.java)
  e [`ItemVentaDirecta`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/entity/ItemVentaDirecta.java),
  DTOs, [`VentaDirectaService`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/service/VentaDirectaService.java)
  e impl, y controller [`AdminVentaDirectaController`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/controller/admin/AdminVentaDirectaController.java)
  bajo `/api/admin/ventas-directas` (protegido por rol admin).
- [x] **Inventario**: al crear la venta se descuenta el stock (variante o producto) con el
  servicio único de inventario; al **cancelar** se devuelve el stock; al **reactivar** se
  vuelve a reservar (solo si hay disponibilidad). El estado "cobrada/pendiente" no toca stock.
- [x] **Panel admin**: página [`VentaDirecta.jsx`](e-comerce-skd/frontend-admin/src/pages/VentaDirecta.jsx),
  API [`ventasDirectasApi.js`](e-comerce-skd/frontend-admin/src/api/ventasDirectasApi.js), ruta
  `/ventas-directas` y menú "Venta directa". Formulario con cliente libre, método de pago,
  "¿ya cobrado?", productos con variantes (valida talla/color y stock) y total; listado con
  filtros, detalle y acciones (Cobrar / Por cobrar / Cancelar / Reactivar).
- [x] **Clientes guardados + autocompletado**: nueva entidad [`ClienteVentaDirecta`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/entity/ClienteVentaDirecta.java)
  (tabla `cliente_venta_directa` + columna `venta_directa.cliente_id` en
  [`schema.sql`](e-comerce-skd/src/main/resources/schema.sql) y
  [`sql/crear_venta_directa.sql`](e-comerce-skd/sql/crear_venta_directa.sql)). Al registrar una
  venta se crea/reutiliza el cliente (por `clienteId` o por nombre). Endpoint
  `GET /api/admin/ventas-directas/clientes?q=` y búsqueda en vivo (debounce) en el formulario:
  al elegir una coincidencia se autocompletan nombre y teléfono.

### Pendiente / nota

- [ ] Las ventas directas no cuentan en "Productos más vendidos" ni en reportes/estadísticas
  basadas en `item_pedido`/`pago aprobado`. Si se quieren incluir, integrar el módulo en esos
  reportes.
- [ ] No genera factura (los pedidos online generan `factura`); opcional emitir documento para
  ventas directas.

---

## 0c. Imágenes de tipos de empaque (implementado 2026-09-07)

- [x] Campo `empaque.imagen_url` (migración en [`schema.sql`](e-comerce-skd/src/main/resources/schema.sql)
  y espejo [`sql/agregar_imagen_empaque.sql`](e-comerce-skd/sql/agregar_imagen_empaque.sql)).
- [x] Endpoint admin `POST /api/admin/empaques/{id}/imagen` (multipart) que sube a Supabase
  Storage y guarda la URL en el empaque ([`AdminEmpaqueController`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/controller/admin/AdminEmpaqueController.java)).
- [x] Panel [`Empaques.jsx`](e-comerce-skd/frontend-admin/src/pages/Empaques.jsx): columna Imagen
  con miniatura y carga de imagen (con vista previa) al crear/editar un tipo de empaque.
- [x] Tienda [`Checkout.jsx`](e-comerce-skd/frontend/src/pages/Checkout.jsx): muestra la imagen del
  tipo de empaque elegido (mantiene el icono como respaldo cuando no hay imagen).

---

## 0d. Diseño del producto guardado automáticamente en la compra (implementado 2026-09-07)

> Cuando el cliente personaliza un producto en el editor (Personalizador) y compra, el diseño
> quedaba ligado al ítem del carrito (`personalizacion`) y se **perdía** al vaciar el carrito tras
> el checkout: el admin no podía ver el diseño en el pedido. Ahora se persiste como snapshot.

### Implementado

- [x] **Snapshot del diseño en el checkout**: [`CheckoutServiceImpl`](e-comerce-skd/src/main/java/com/skd/sublimacion_api/service/impl/CheckoutServiceImpl.java:374)
  convierte la `Personalizacion` de cada ítem personalizado (imagen aplanada + descripción del
  editor) en un registro `Diseno` (`origen=USUARIO`, `usado=true`) y lo asocia al `item_pedido`
  ANTES de vaciar el carrito. El método nuevo `snapshotDePersonalizacion` solo actúa cuando el ítem
  no trae ya un diseño elegido (galería/IA/"Mis diseños"), que se conserva tal cual.
- [x] **Admin ya visualizaba el diseño**: el detalle de pedido del panel
  [`Pedidos.jsx`](e-comerce-skd/frontend-admin/src/pages/Pedidos.jsx:381) muestra `imagenDisenoUrl`
  (miniatura + "Ver diseño" a pantalla completa) y el kanban
  [`Produccion.jsx`](e-comerce-skd/frontend-admin/src/pages/Produccion.jsx:228) marca la insignia
  "diseño". Con el snapshot, los productos personalizados ahora llegan con diseño visible.

### Pendiente / nota

- [ ] **Sin migración de BD**: se reutiliza la tabla `diseno` (columna `diseno_id` ya existente en
  `item_pedido`). Los pedidos generados ANTES de este cambio conservan la pérdida (no recuperables).
- [ ] **Imagen como data-URL**: la `personalizacion.imagen_url` la envía el editor aplanada en
  base64 y se copia tal cual al snapshot. Para pedidos grandes esto puede agrandar el JSON del
  detalle. Opcional futuro: re-subir el archivo a Supabase y guardar solo la URL.

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
- [x] **Descontar stock de la variante** al confirmar el pedido y validar disponibilidad antes de
  pagar (evitar ventas sin stock). *Implementado*: ver sección "Inventario / stock".
- [ ] **Selector de talla/color en el catálogo público** (`DetalleProducto`/`ProductCard`) usando
  `GET /api/productos/{id}/variantes`.
- [x] **Coherencia de stock**: definido — el stock operativo de un producto con variantes es la suma
  del stock de sus variantes; `producto.stock` queda como valor base solo para productos sin
  variantes. *Implementado*: ver sección "Inventario / stock".

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
