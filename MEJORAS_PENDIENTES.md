# Mejoras pendientes — SKD Creando Sueños

> Archivo de referencia de trabajo para acumular mejoras NO relacionadas con el panel administrativo.
> Cuando se decida, se consolidara en un reporte formal.

## Resueltas por integracion de develop (2026-08-19)

- [x] **`/api/carritos/**` en `permitAll`**: resuelto por develop (`4660a85` — restringir `/api/carritos/**`). Ahora exige autenticacion.
- [x] **Validacion de dueno (IDOR) en carrito/pedido**: resuelto por develop (`4660a85` — cerrar fuga de datos en `listar()` genericos y validacion de dueno). Se agregaron los controllers de carrito/pedido/direccion/factura/pago.
- [x] **Secretos hardcodeados en `application.properties`**: resuelto por develop (`4eeed79` — mover `jwt.secret` y `datasource.password` a variables de entorno). Ahora usa `${JWT_SECRET}` y `${DB_PASSWORD}`.
  - Pendiente local: agregar `DB_PASSWORD` y `JWT_SECRET` al `.env` (aun no estan).
- [x] **Envio automatico de correo con factura PDF**: nueva funcionalidad de develop (`51c5218`), usa `${GMAIL_USERNAME}` y `${GMAIL_APP_PASSWORD}` (ya presentes en `.env`).

## Seguridad

- [ ] **Sin token en rutas protegidas devuelve 403, no 401**: falta configurar `AuthenticationEntryPoint` (y `AccessDeniedHandler`) en `SecurityConfig` para distinguir "no autenticado" (401) de "sin permisos" (403). Nota: el handler de `BadCredentialsException` ya devuelve 401 (cambio de feature-admin).
- [ ] **spring-dotenv no carga el `.env` con Spring Boot 4.1.0**: hubo que cargar las variables del `.env` manualmente en la sesion antes de arrancar (`Could not resolve placeholder 'SUPABASE_SERVICE_KEY'`). Verificar compatibilidad de `me.paulschwarz:spring-dotenv:4.0.0` con Spring Boot 4 / Spring Framework 7, o documentar el comando de arranque que carga el `.env`.
- [ ] **`JwtAuthenticationFilter` usa API deprecada**: warning de compilacion (metodo deprecado). Limpiar a futuro.
- [ ] **`WompiService` usa operaciones unchecked**: warning de compilacion. Revisar genericos.

## Rendimiento / Calidad

- [ ] **Serializacion de `PageImpl`**: warning de Spring Data ("Serializing PageImpl instances as-is is not supported"). Recomendacion: usar `@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)` o `PagedModel` para una estructura JSON estable.
- [ ] **`spring.jpa.show-sql=true` activo**: util en desarrollo, pero en produccion debe desactivarse (volumen de logs y rendimiento).

## Otros

- [ ] **Contrasena del usuario `admin` en Supabase desconocida**: `DataInitializer` solo crea el admin si no existe (`Admin123*`), pero el existente conserva otra contrasena. Definir como restablecerla de forma segura en produccion (no sobreescribir en cada arranque).
