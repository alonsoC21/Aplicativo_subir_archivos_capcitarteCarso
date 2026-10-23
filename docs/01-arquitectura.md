# SSD — Documento 01: Arquitectura del Sistema

> Proyecto: **Portal de Transferencia Segura de Archivos — Capacítate Carso**
> Metodología: SSD (Diseño del Sistema de Software)
> Versión: 1.0

---

## 1. Propósito y alcance

Aplicación web para la **transferencia segura de archivos pesados** (principalmente paquetes SCORM en formato `.zip`) entre empresas externas y Capacítate Carso.

El problema de negocio: los firewalls corporativos de las empresas cliente bloquean servicios como Google Drive, WeTransfer, Dropbox, etc. La solución es alojar el portal **bajo el dominio propio `capacitatecarso.com/`**, que ya está permitido por esos firewalls (es un dominio de confianza para las empresas), sirviendo todo por HTTPS en el puerto 443.

### Flujos principales

1. **Administrador (Carso):** genera URLs de subida únicas con contraseña, revisa/descarga archivos, elimina URLs (revoca acceso).
2. **Empresa (cliente):** accede a su URL única, se autentica con contraseña, sube su ZIP por drag & drop, confirma y guarda.

### Fuera de alcance (v1)
- Gestión multiusuario de administradores (v1 asume un admin / credencial única).
- Previsualización del contenido SCORM.
- Notificaciones por correo (futuro).

---

## 2. Decisión de stack (ADR-001)

| Capa | Elección | Motivo |
|------|----------|--------|
| Full-stack | **Next.js 15 (App Router) + TypeScript** | Un solo proyecto, un solo dominio y deploy → evade firewall. Route Handlers para la API. |
| ORM / BD | **Prisma + PostgreSQL** | Modelo tipado, migraciones versionadas. SQLite opcional en desarrollo local. |
| Estilos | **Tailwind CSS** | Replica rápida y precisa de la identidad visual Carso. |
| Validación | **Zod** | Validación de entradas en servidor y cliente. |
| Hash de contraseñas | **bcrypt** (o argon2) | Estándar para contraseñas en reposo. |
| IDs/slugs | **nanoid** | URLs no adivinables, alta entropía. |
| Almacenamiento | **Abstracción `StorageProvider`** | v1 = disco local; futuro = AWS S3 sin reescribir dominio. |

### ADR-002 — Estrategia de almacenamiento

El almacenamiento se accede **siempre** a través de una interfaz `StorageProvider`:

```ts
interface StorageProvider {
  save(key: string, stream: Readable, meta: FileMeta): Promise<void>;
  getStream(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
```

- **v1 — `LocalStorageProvider`:** guarda en `./storage/<slug>/<archivo>`.
- **Futuro — `S3StorageProvider`:** misma interfaz, usa AWS SDK + multipart upload + presigned URLs.

El cambio se activa por variable de entorno `STORAGE_DRIVER=local | s3`. **Ningún handler de dominio cambia** al migrar.

---

## 3. Arquitectura en capas

```
┌─────────────────────────────────────────────────────────────┐
│                        NAVEGADOR                               │
│   Panel Admin (React/Next)      Vista Empresa (React/Next)     │
└───────────────┬───────────────────────────┬───────────────────┘
                │ HTTPS (capacitatecarso.com)│
┌───────────────▼───────────────────────────▼───────────────────┐
│                   NEXT.JS 15 (App Router)                      │
│                                                                │
│  ┌──────────────┐   ┌───────────────────────────────────────┐ │
│  │  UI Layer     │   │           API (Route Handlers)         │ │
│  │  app/(admin)  │   │  /api/admin/links   /api/upload/[slug] │ │
│  │  app/u/[slug] │   │  /api/admin/...     /api/download/...   │ │
│  └──────────────┘   └───────────────┬───────────────────────┘ │
│                                      │                          │
│  ┌───────────────────────────────────▼──────────────────────┐ │
│  │                    CAPA DE SERVICIOS (dominio)             │ │
│  │   LinkService · AuthService · FileService · StorageProvider│ │
│  └───────────────┬───────────────────────────┬──────────────┘ │
└──────────────────┼───────────────────────────┼─────────────────┘
                   │                            │
          ┌────────▼─────────┐        ┌─────────▼──────────┐
          │   PostgreSQL      │        │  StorageProvider    │
          │  (Prisma)         │        │  local ./storage    │
          │  links, files,    │        │  → futuro: AWS S3   │
          │  sessions         │        └─────────────────────┘
          └───────────────────┘
```

### Responsabilidad por capa
- **UI Layer:** render de paneles y formularios; nunca accede a BD directo.
- **API (Route Handlers):** valida entrada (Zod), aplica auth, delega en servicios.
- **Servicios de dominio:** reglas de negocio (unicidad de slug, revocación, hash de passwords).
- **Persistencia:** Prisma (BD) + `StorageProvider` (archivos).

---

## 4. Seguridad (visión general)

- **URLs no adivinables:** slug `nanoid(21)` (~126 bits de entropía), único en BD.
- **Contraseña por enlace:** generada aleatoriamente (12+ chars), **hasheada** (bcrypt) en BD. El valor en claro solo se muestra al admin al crearla.
- **Sesión de empresa:** tras validar password se emite un cookie de sesión firmado (HttpOnly, Secure, SameSite=Strict) ligado al `slug`.
- **Autenticación admin:** credencial de administrador (env) + sesión protegida.
- **Validación de archivo:** solo `.zip`, verificación de extensión + tipo MIME, límite de tamaño configurable.
- **Revocación total:** eliminar una URL borra el registro, el archivo físico y las sesiones asociadas.
- **Transporte:** HTTPS obligatorio; cabeceras de seguridad (HSTS, CSP básica).

---

## 5. Manejo de archivos pesados

- El upload se recibe por **streaming** y se escribe directo al `StorageProvider` (no se bufferiza completo en memoria).
- En v1 local: stream del request → escritura en disco.
- En futuro S3: **multipart upload** / **presigned URLs** para que el archivo ni siquiera pase por el servidor de aplicación.
- Límite de tamaño configurable por env (`MAX_UPLOAD_MB`).

---

## 6. Estructura de carpetas propuesta

```
.
├── agents.md
├── docs/
│   ├── 01-arquitectura.md
│   ├── 02-modelo-datos.md
│   └── 03-diseno-api.md
├── prisma/
│   └── schema.prisma
├── storage/                      # archivos subidos (v1 local) — en .gitignore
├── src/
│   ├── app/
│   │   ├── (admin)/admin/        # panel de administración
│   │   ├── u/[slug]/             # vista de empresa (login + upload)
│   │   └── api/                  # route handlers
│   │       ├── admin/links/
│   │       ├── auth/[slug]/
│   │       ├── upload/[slug]/
│   │       └── download/[slug]/
│   ├── components/               # UI reutilizable (header Carso, dropzone, etc.)
│   ├── lib/
│   │   ├── storage/              # StorageProvider (local, s3)
│   │   ├── db.ts                 # cliente Prisma
│   │   ├── auth.ts               # sesiones
│   │   └── validation.ts         # esquemas Zod
│   └── server/                   # servicios de dominio
│       ├── link.service.ts
│       ├── file.service.ts
│       └── auth.service.ts
├── .env.example
└── package.json
```
