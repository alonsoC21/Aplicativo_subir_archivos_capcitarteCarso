# Portal de Transferencia Segura de Archivos — Capacítate Carso

Aplicación web full-stack para la subida segura de paquetes SCORM (`.zip`) entre
empresas externas y Capacítate Carso. Se aloja bajo el dominio propio
`capacitatecarso.com/` para evadir los bloqueos de firewall corporativo que
restringen servicios de terceros (Google Drive, WeTransfer, etc.).

## Stack

- **Next.js 15** (App Router) + **TypeScript** — frontend y API en un solo proyecto.
- **Prisma** + **SQLite** (desarrollo). Migrable a PostgreSQL en producción.
- **Tailwind CSS** — identidad visual de Capacítate Carso (teal `#00A6B4`).
- **Almacenamiento** abstraído (`StorageProvider`): disco local hoy, AWS S3 después.
- **bcryptjs** (hash de contraseñas), **jose** (sesiones JWT), **nanoid** (slugs),
  **zod** (validación).

## Flujos

- **Admin** (`/admin`): login, crear URLs con contraseña autogenerada, listar,
  ver detalle (URL / pass oculta / archivo), descargar y eliminar (revocación total).
- **Empresa** (`/u/<slug>`): acceso con contraseña, drag & drop del ZIP,
  confirmación (nombre + extensión) y guardado.

## Requisitos

- Node.js 20+ (probado con 22).

## Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno (copiar y ajustar)
#    En Windows PowerShell:
Copy-Item .env.example .env
#    El .env de pruebas ya incluye admin/12345.

# 3. Crear la base de datos SQLite
npm run db:push

# 4. Arrancar en desarrollo
npm run dev
```

Abrir http://localhost:3000 (redirige a `/admin`).

### Credenciales de administrador (solo pruebas)

- Usuario: `admin`
- Contraseña: `12345`

Definidas en `.env` (`ADMIN_USER`, `ADMIN_PASSWORD`). Cambiar en producción.

## Variables de entorno

Ver `.env.example`. Las principales:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Conexión a la BD (`file:./dev.db` para SQLite). |
| `ADMIN_USER` / `ADMIN_PASSWORD` | Credenciales del administrador. |
| `SESSION_SECRET` | Secreto para firmar sesiones (≥32 chars). |
| `STORAGE_DRIVER` | `local` (hoy) o `s3` (futuro). |
| `STORAGE_LOCAL_DIR` | Carpeta de archivos en modo local (`./storage`). |
| `MAX_UPLOAD_BYTES` | Límite de subida (10 GB por defecto). |
| `PUBLIC_BASE_URL` | URL base para construir los enlaces. |

## Scripts

| Script | Acción |
|--------|--------|
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Build de producción (genera Prisma Client). |
| `npm run start` | Servidor de producción. |
| `npm run db:push` | Sincroniza el esquema con la BD. |
| `npm run db:studio` | Prisma Studio (inspección de datos). |

## Pruebas end-to-end

Con el servidor levantado (`npm run dev`):

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\e2e-test.ps1"
```

Cubre: login admin, creación/listado de enlaces, auth de empresa, subida por
streaming, descarga con verificación de integridad (hash), rechazo de archivos
no-zip, eliminación y revocación de acceso.

## Documentación (metodología SSD)

- [`docs/01-arquitectura.md`](docs/01-arquitectura.md) — arquitectura y decisiones (ADR).
- [`docs/02-modelo-datos.md`](docs/02-modelo-datos.md) — modelo de base de datos.
- [`docs/03-diseno-api.md`](docs/03-diseno-api.md) — diseño de la API.
- [`agents.md`](agents.md) — roles del proyecto.

## Migración futura a AWS S3

El almacenamiento se accede solo por la interfaz `StorageProvider`
(`src/lib/storage/`). Para migrar a S3 se añade un `S3StorageProvider` con la
misma interfaz (multipart upload / presigned URLs) y se cambia
`STORAGE_DRIVER=s3`, sin tocar la lógica de dominio.

## Seguridad

- URLs con slug no adivinable (`nanoid`, ~126 bits) y únicos en BD.
- Contraseñas de enlace generadas al azar y hasheadas (bcrypt); el valor en
  claro solo se muestra al crear.
- Sesiones JWT firmadas en cookies HttpOnly/SameSite=Strict.
- Validación de extensión y MIME (solo `.zip`) y límite de tamaño.
- Eliminar una URL borra registro, archivo físico y sesiones (revocación total).

> **Nota:** `opencode.json` y `context7.mcp.kiro.json` contienen una API key de
> Context7 y están excluidos del control de versiones en `.gitignore`. No subir
> secretos al repositorio.
