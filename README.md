# SKD — E-commerce de Sublimación

Plataforma de e-commerce de productos personalizados por sublimación (camisetas, mugs, gorras, cojines, llaveros y más), desarrollada como proyecto final del SENA.

El proyecto es un monorepo con dos partes:

- **Backend** (raíz del repo): API REST en Spring Boot.
- **Frontend** (`frontend/`): aplicación web en React + Vite.

## Stack técnico

### Backend

- **Java 21**
- **Spring Boot 4.1.0**
- **Maven** (incluye wrapper `./mvnw`)
- **Spring Security + JWT** (jjwt 0.13.0)
- **Spring Data JPA / Hibernate**
- **PostgreSQL** alojado en **Supabase** (conexión vía Transaction Pooler, puerto 6543)
- **Spring WebFlux** (WebClient para Cloudflare y Wompi)
- **Spring Mail** (envío de correos con factura PDF)
- **OpenPDF** (generación de factura electrónica en PDF)
- **springdoc-openapi** (Swagger UI)
- **Lombok**

### Frontend

- **React 19**
- **Vite 8**
- **React Router 7**
- **Axios**
- **Tailwind CSS 4**
- **Framer Motion**
- **Lucide React** y **React Icons**
- **Three.js**

## Estructura del proyecto

```
.
├── src/                          # Backend Spring Boot
│   └── main/java/com/skd/sublimacion_api/
│       ├── config/               # Configuración (seguridad, datos iniciales, etc.)
│       ├── controller/           # Controllers REST (cliente y admin)
│       ├── dto/                  # Objetos de transferencia
│       ├── entity/               # Entidades JPA
│       ├── exeption/             # Excepciones y handler global
│       ├── mapper/               # Mappers de entidad a DTO
│       ├── repository/           # Repositorios JPA
│       ├── security/             # Filtro y servicio JWT
│       ├── service/              # Lógica de negocio
│       └── specification/        # Specifications para filtros
├── frontend/                     # Aplicación React + Vite
│   └── src/
├── sql/                          # Scripts SQL de referencia
├── pom.xml
└── mvnw                          # Wrapper de Maven
```

## Requisitos previos

- **JDK 21**
- **Maven 3.9+** (o usar el wrapper `./mvnw`)
- **Node.js 20+** y **npm**

## Variables de entorno

El backend lee la configuración desde variables de entorno. Debes definirlas antes de arrancar (en un archivo `.env` o exportándolas en tu shell).

| Variable | Descripción | Dónde se consigue |
|---|---|---|
| `DB_PASSWORD` | Contraseña de la base de datos PostgreSQL (Supabase, Transaction Pooler puerto 6543). | Supabase → *Project Settings → Database → Connection string* (Transaction Pooler). |
| `JWT_SECRET` | Clave secreta para firmar y validar los tokens JWT. | Valor arbitrario que defines tú; debe ser una cadena larga (la app usa HMAC-SHA256). |
| `CLOUDFLARE_ACCOUNT_ID` | ID de la cuenta de Cloudflare (Workers AI, generador de diseños). | `dash.cloudflare.com` → el Account ID aparece en el dashboard. |
| `CLOUDFLARE_API_TOKEN` | Token de API de Cloudflare. | `dash.cloudflare.com` → perfil → *API Tokens*. |
| `SUPABASE_SERVICE_KEY` | `service_role` key de Supabase (para subir imágenes de diseños a Storage). | Supabase → *Project Settings → API → service_role*. |
| `GMAIL_USERNAME` | Correo Gmail desde el que se envían los correos (bienvenida y factura). | Tu cuenta de Gmail. |
| `GMAIL_APP_PASSWORD` | Contraseña de aplicación de Gmail (16 caracteres). | `myaccount.google.com` → *Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones*. |
| `WOMPI_PUBLIC_KEY` | Llave pública de Wompi (sandbox). | `comercios.wompi.co` → *Configuración → API*, en modo **Pruebas/Sandbox**. |
| `WOMPI_PRIVATE_KEY` | Llave privada de Wompi (sandbox). | Mismo lugar que la pública. |
| `WOMPI_EVENTS_KEY` | Llave de eventos de Wompi (para webhooks). | Mismo lugar. |
| `WOMPI_REDIRECT_URL` | URL a la que Wompi redirige tras el pago. (Opcional, tiene valor por defecto). | Se define manualmente; por defecto es `http://localhost:5173/checkout/resultado`. |
| `VITE_API_URL` | URL base de la API que consume el frontend. | Se define en `frontend/.env`; por defecto `http://localhost:8080/api`. |

> **Nota:** `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY` y `WOMPI_EVENTS_KEY` son necesarias solo para la pasarela de pagos; `WOMPI_REDIRECT_URL` tiene un valor por defecto para desarrollo.

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd e-comerce-skd
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto (está ignorado por git) con el formato `CLAVE=valor`:

```bash
DB_PASSWORD=
JWT_SECRET=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
SUPABASE_SERVICE_KEY=
GMAIL_USERNAME=
GMAIL_APP_PASSWORD=
WOMPI_PUBLIC_KEY=
WOMPI_PRIVATE_KEY=
WOMPI_EVENTS_KEY=
WOMPI_REDIRECT_URL=http://localhost:5173/checkout/resultado
```

Si la aplicación no toma el `.env` automáticamente, expórtalas antes de correr:

```bash
set -a; source .env; set +a
```

(o agrégalas con `export` a tu `~/.bashrc` / `~/.zshrc`).

### 3. Backend

Desde la raíz del proyecto:

```bash
./mvnw spring-boot:run
```

La API queda disponible en `http://localhost:8080` y Swagger UI en `http://localhost:8080/swagger-ui/index.html`.

### 4. Frontend

En otra terminal:

```bash
cd frontend
npm install
```

Configura la URL de la API en `frontend/.env` (si no existe):

```bash
VITE_API_URL=http://localhost:8080/api
```

Luego arranca el servidor de desarrollo:

```bash
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

## Flujo de trabajo

Se usa un modelo tipo GitFlow:

- `main` — código estable, listo para producción.
- `develop` — rama de integración; aquí se juntan los cambios antes de ir a producción.
- `feature-*` — una rama por tarea/funcionalidad. Se crea desde `develop` y, al terminar, se abre un **Pull Request** de vuelta hacia `develop`.
