# API del Panel Administrativo — `/api/admin/**`

Guía para el equipo de frontend. Todos los endpoints del panel administrativo están bajo `/api/admin/**` y requieren un usuario con rol `admin`.

---

## 1. Autenticación

Todos los endpoints requieren el header:

```
Authorization: Bearer <ACCESS_TOKEN>
```

El token se obtiene con el login (endpoint público):

```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin123*"
}
```

Respuesta (ejemplo):

```json
{
  "token": "<access token>",
  "refreshToken": "<refresh token>",
  "id": 1,
  "nombre": "Administrador",
  "username": "admin",
  "correo": "admin@skd.com",
  "rol": "admin"
}
```

Guardar `token` en `localStorage` y enviarlo como `Authorization: Bearer <token>` en cada petición. El campo `rol` indica si el usuario es `admin` o `cliente` (minúsculas). El frontend debe proteger las rutas `/admin/**` verificando que `usuario.rol === "admin"`.

**Autorización:** un usuario con rol `cliente` (o sin token) recibe **403 Forbidden** en cualquier endpoint `/api/admin/**`.

---

## 2. Paginación

Los listados devuelven un objeto `Page` de Spring Data:

```json
{
  "content": [ ... ],
  "pageable": { ... },
  "totalElements": 18,
  "totalPages": 2,
  "size": 10,
  "number": 0,
  "first": true,
  "last": false,
  "empty": false
}
```

Parámetros de consulta: `page` (0-based), `size` (por defecto 10), `sort` (ej. `sort=id,desc`).

---

## 3. Productos

Base: `/api/admin/productos`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/productos` | Listar paginado con filtros |
| GET | `/api/admin/productos/{id}` | Obtener por id |
| POST | `/api/admin/productos` | Crear (201) |
| PUT | `/api/admin/productos/{id}` | Actualizar |
| DELETE | `/api/admin/productos/{id}` | Eliminación lógica (204) |
| PATCH | `/api/admin/productos/{id}/restaurar` | Restaurar eliminado lógico (204) |

**Filtros del listado** (todos opcionales): `nombre`, `categoriaId`, `activo` (true/false), `precioMin`, `precioMax` + paginación.

**ProductoRequest (body):**

```json
{
  "nombre": "Camiseta Blanca",
  "descripcion": "Camiseta 100% poliéster",
  "precio": 35000,
  "stock": 50,
  "activo": true,
  "masVendido": false,
  "categoriaId": 1
}
```

**ProductoResponse:**

```json
{
  "id": 1,
  "nombre": "Camiseta Blanca",
  "descripcion": "Camiseta 100% poliéster",
  "precio": 35000.00,
  "stock": 50,
  "activo": true,
  "masVendido": false,
  "categoria": "Camisetas"
}
```

---

## 4. Categorías

Base: `/api/admin/categorias`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/categorias` | Listar paginado |
| GET | `/api/admin/categorias/{id}` | Obtener por id |
| POST | `/api/admin/categorias` | Crear (201) |
| PUT | `/api/admin/categorias/{id}` | Actualizar |
| DELETE | `/api/admin/categorias/{id}` | Eliminar (204). Error 400 si tiene subcategorías o productos |

**CategoriaRequest:**

```json
{
  "nombre": "Camisetas",
  "descripcion": "Camisetas personalizadas",
  "categoriaPadreId": null
}
```

**CategoriaResponse:**

```json
{ "id": 1, "nombre": "Camisetas", "descripcion": "...", "categoriaPadreId": null }
```

---

## 5. Cupones

Base: `/api/admin/cupones`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/cupones` | Listar paginado con filtros |
| GET | `/api/admin/cupones/{id}` | Obtener por id |
| POST | `/api/admin/cupones` | Crear (201) |
| PUT | `/api/admin/cupones/{id}` | Actualizar |
| DELETE | `/api/admin/cupones/{id}` | Eliminación lógica (204) |

**Filtros del listado** (opcionales): `codigo`, `activo`, `fechaInicio`, `fechaFin` + paginación.

**CuponRequest:**

```json
{
  "codigo": "BIENVENIDA10",
  "descuentoPorcentaje": 10.00,
  "fechaInicio": "2026-08-01",
  "fechaFin": "2027-01-01",
  "usosMaximos": 100,
  "activo": true
}
```

**CuponResponse:**

```json
{
  "id": 1,
  "codigo": "BIENVENIDA10",
  "descuentoPorcentaje": 10.00,
  "fechaInicio": "2026-08-01",
  "fechaFin": "2027-01-01",
  "usosMaximos": 100,
  "usosActuales": 0,
  "activo": true
}
```

---

## 6. Empaques

Base: `/api/admin/empaques`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/empaques` | Listar paginado con filtro `tipo` (opcional) |
| GET | `/api/admin/empaques/{id}` | Obtener por id |
| POST | `/api/admin/empaques` | Crear (201) |
| PUT | `/api/admin/empaques/{id}` | Actualizar |
| DELETE | `/api/admin/empaques/{id}` | Eliminar (204). Error 400 si tiene pedidos asociados |

**EmpaqueRequest:**

```json
{
  "tipo": "Premium",
  "descripcion": "Caja premium con papel de seda",
  "costoAdicional": 5000.00
}
```

**EmpaqueResponse:**

```json
{ "id": 1, "tipo": "Premium", "descripcion": "...", "costoAdicional": 5000.00 }
```

---

## 7. Usuarios

Base: `/api/admin/usuarios`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/usuarios` | Listar paginado con filtros |
| GET | `/api/admin/usuarios/{id}` | Obtener por id |
| POST | `/api/admin/usuarios` | Crear (201) |
| PUT | `/api/admin/usuarios/{id}` | Actualizar |
| PATCH | `/api/admin/usuarios/{id}/bloquear` | Bloquear (204) |
| PATCH | `/api/admin/usuarios/{id}/desbloquear` | Desbloquear (204) |
| PATCH | `/api/admin/usuarios/{id}/rol` | Cambiar rol (204) |

**Filtros del listado** (opcionales): `nombre`, `username`, `correo`, `rol` (admin/cliente), `bloqueado`, `verificado` + paginación.

**UsuarioRequest:**

```json
{
  "nombre": "Daniel",
  "username": "daniel",
  "correo": "daniel@correo.com",
  "telefono": "3001234567",
  "contrasena": "123456",
  "rol": "cliente"
}
```

**UsuarioResponse:**

```json
{
  "id": 7,
  "nombre": "Daniel",
  "username": "daniel",
  "correo": "daniel@correo.com",
  "telefono": "3001234567",
  "verificado": false,
  "bloqueado": false,
  "rol": "cliente"
}
```

**CambiarRolRequest** (`PATCH /{id}/rol`): `{ "rol": "admin" }`

---

## 8. Pedidos

Base: `/api/admin/pedidos`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/pedidos` | Listar paginado con filtros |
| GET | `/api/admin/pedidos/kanban` | Tablero de producción agrupado por estado |
| GET | `/api/admin/pedidos/{id}` | Detalle con productos y diseños |
| PATCH | `/api/admin/pedidos/{id}/estado` | Cambiar estado |

**Filtros del listado** (opcionales): `estado` (recibido, disenando, imprimiendo, empacando, enviado, entregado, cancelado), `usuarioId` + paginación.

**Estados de producción (kanban):** `recibido`, `disenando`, `imprimiendo`, `empacando`, `enviado`.

**GET `/api/admin/pedidos/kanban`** — respuesta:

```json
{
  "recibido":  [ { "id": 11, "usuarioId": 7, "usuario": "Daniel", "estado": "recibido", "total": 57000.00, "creadoEn": "2026-07-31T03:50:00", "cantidadItems": 3, "tieneDiseno": true, "guiaEnvio": null } ],
  "disenando":  [],
  "imprimiendo": [],
  "empacando":  [],
  "enviado":  []
}
```

**CambiarEstadoPedidoRequest:**

```json
{ "estado": "enviado" }
```

**PedidoResponse:**

```json
{
  "id": 11,
  "usuarioId": 7,
  "usuario": "Daniel",
  "creadoEn": "2026-07-31T03:50:00",
  "estado": "recibido",
  "subtotal": 45000.00,
  "costoEnvio": 12000.00,
  "descuento": 0.00,
  "total": 57000.00,
  "items": [
    {
      "id": 1,
      "productoId": 3,
      "producto": "Camiseta Blanca Sublimable",
      "cantidad": 2,
      "precioUnitario": 35000.00,
      "subtotal": 70000.00,
      "disenoId": null,
      "imagenDisenoUrl": null
    }
  ]
}
```

---

## 9. Dashboard

Base: `/api/admin/dashboard`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/dashboard/resumen` | Totales y ventas |
| GET | `/api/admin/dashboard/productos-mas-vendidos?limite=5` | Top productos |
| GET | `/api/admin/dashboard/ventas-por-periodo` | Ventas agrupadas por mes (YYYY-MM) |

**Resumen:**

```json
{
  "totalUsuarios": 10,
  "totalProductos": 17,
  "totalPedidos": 18,
  "ventasTotales": 1843920.00,
  "pedidosPendientes": 17,
  "pedidosCompletados": 0,
  "pedidosCancelados": 0
}
```

**Producto más vendido (item):**

```json
{ "productoId": 3, "producto": "Camiseta Blanca", "unidadesVendidas": 5, "ingresoTotal": 175000.00 }
```

**Venta por periodo (item):**

```json
{ "periodo": "2026-07", "total": 1843920.00 }
```

---

## 10. Reportes

Base: `/api/admin/reportes` — descargan un archivo (attachment).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/reportes/{tipo}/csv` | Exporta CSV (abre en Excel), UTF-8 con BOM |
| GET | `/api/admin/reportes/{tipo}/pdf` | Exporta PDF |

`{tipo}` puede ser: `ventas`, `pedidos`, `usuarios`, `productos`.

Uso en el frontend: petición con `Authorization: Bearer <token>` y `responseType: 'blob'` (axios), luego disparar la descarga con `URL.createObjectURL`.

---

## 11. Variantes

Base: `/api/admin/variantes`

CRUD de variantes por producto (talla / color / stock / precio opcional).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/variantes/producto/{productoId}` | Listar variantes de un producto |
| GET | `/api/admin/variantes/{id}` | Obtener por id |
| POST | `/api/admin/variantes` | Crear (201) |
| PUT | `/api/admin/variantes/{id}` | Actualizar |
| DELETE | `/api/admin/variantes/{id}` | Eliminar (204) |

**VarianteRequest (body):**

```json
{
  "productoId": 3,
  "talla": "M",
  "color": "Azul",
  "stock": 10,
  "precio": 37000.00,
  "activo": true
}
```

`talla` y/o `color` son opcionales (al menos uno obligatorio). `precio` opcional: si se omite, se usa el precio base del producto.

**VarianteResponse:**

```json
{
  "id": 1,
  "productoId": 3,
  "productoNombre": "Camiseta Blanca Sublimable",
  "talla": "M",
  "color": "Azul",
  "stock": 10,
  "precio": 37000.00,
  "activo": true
}
```

**Regla de negocio:** no puede existir más de una variante con la misma combinación `talla + color` para el mismo producto (error 400).

---

## 12. Moderación de reseñas

Base: `/api/admin/resenas`

Aprueba o rechaza reseñas (incluidas las que traen foto) antes de que sean públicas.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/resenas` | Listar paginado, filtro `estado` (opcional) |
| GET | `/api/admin/resenas/{id}` | Obtener por id |
| PATCH | `/api/admin/resenas/{id}/aprobar` | Aprobar (visible públicamente) |
| PATCH | `/api/admin/resenas/{id}/rechazar` | Rechazar (oculta) |
| DELETE | `/api/admin/resenas/{id}` | Eliminar (204) |

**Estados:** `pendiente` (nueva, espera moderación), `aprobada`, `rechazada`.

**ResenaResponse:**

```json
{
  "id": 5,
  "productoId": 3,
  "productoNombre": "Camiseta Blanca Sublimable",
  "usuarioId": 7,
  "usuarioNombre": "Daniel",
  "calificacion": 5,
  "comentario": "Excelente calidad",
  "imagenUrl": "https://.../resena.jpg",
  "estado": "pendiente",
  "creadoEn": "2026-08-20T10:00:00",
  "compraVerificada": true
}
```

**Nota:** el listado público `GET /api/resenas/producto/{productoId}` solo muestra reseñas `aprobada`; los promedios de calificación en el catálogo solo cuentan reseñas aprobadas. Las nuevas reseñas nacen en `pendiente`.

---

## 13. Códigos de error

Formato de respuesta de error:

```json
{
  "timestamp": "2026-08-19T03:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "mensaje descriptivo"
}
```

| Código | Significado |
|---|---|
| 400 | Datos inválidos o regla de negocio (ej. cupón duplicado, empaque con pedidos) |
| 401 | Credenciales inválidas o token no enviado/válido |
| 403 | No autorizado (rol insuficiente, ej. cliente accediendo a /admin) |
| 404 | Recurso no encontrado |
| 500 | Error interno |

Errores de validación (`@Valid`) devuelven `400` con un objeto `fields` (campo → mensaje).
