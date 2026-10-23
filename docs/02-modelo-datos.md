# SSD — Documento 02: Modelo de Base de Datos

> Proyecto: **Portal de Transferencia Segura de Archivos — Capacítate Carso**
> Motor: PostgreSQL (SQLite válido para desarrollo local)
> ORM: Prisma

---

## 1. Visión general

El modelo gira en torno a tres entidades:

- **UploadLink** — una URL de subida generada por el admin (nombre, slug, contraseña hasheada).
- **UploadedFile** — metadatos del archivo cargado en un enlace (nombre, extensión, tamaño, key de storage).
- **ClientSession** — sesión de la empresa tras autenticarse con la contraseña del enlace.

Relaciones:
- `UploadLink 1 ── 0..1 UploadedFile` (un enlace tiene como máximo un archivo activo en v1).
- `UploadLink 1 ── 0..N ClientSession`.
- Al **eliminar** un `UploadLink`, se eliminan en cascada su archivo y sus sesiones (revocación total).

---

## 2. Diagrama entidad-relación

```
┌───────────────────────────┐
│        UploadLink          │
├───────────────────────────┤
│ id            (PK)         │
│ name                       │  "Nombre identificador" (admin)
│ slug          (UNIQUE)     │  segmento de URL no adivinable
│ passwordHash               │  bcrypt de la contraseña del enlace
│ createdAt                  │
│ updatedAt                  │
└───────┬───────────────┬────┘
        │ 1             │ 1
        │               │
        │ 0..1          │ 0..N
┌───────▼──────────┐  ┌─▼───────────────────────┐
│   UploadedFile    │  │     ClientSession        │
├───────────────────┤  ├──────────────────────────┤
│ id          (PK)  │  │ id            (PK)        │
│ linkId      (FK,U)│  │ linkId        (FK)        │
│ originalName      │  │ tokenHash                 │
│ extension         │  │ createdAt                 │
│ sizeBytes         │  │ expiresAt                 │
│ mimeType          │  └──────────────────────────┘
│ storageKey        │
│ uploadedAt        │
└───────────────────┘
```

---

## 3. Definición de tablas

### 3.1 `UploadLink`
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `String` (cuid) | PK | Identificador interno. |
| `name` | `String` | not null | Nombre identificador asignado por el admin. |
| `slug` | `String` | **unique**, not null | Segmento aleatorio de la URL (`nanoid(21)`). Garantiza unicidad. |
| `passwordHash` | `String` | not null | Hash bcrypt de la contraseña del enlace. **Nunca se guarda en claro.** |
| `createdAt` | `DateTime` | default now | Fecha de creación. |
| `updatedAt` | `DateTime` | auto | Última modificación. |

### 3.2 `UploadedFile`
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `String` (cuid) | PK | |
| `linkId` | `String` | FK → UploadLink.id, **unique** | Relación 1:1 con el enlace. |
| `originalName` | `String` | not null | Nombre original del archivo (ej. `curso.zip`). |
| `extension` | `String` | not null | Extensión (ej. `zip`). Se muestra en el panel. |
| `sizeBytes` | `BigInt` | not null | Tamaño en bytes. |
| `mimeType` | `String` | not null | Tipo MIME validado. |
| `storageKey` | `String` | not null | Clave en el `StorageProvider` (ruta local hoy, key S3 mañana). |
| `uploadedAt` | `DateTime` | default now | Fecha de subida. |

### 3.3 `ClientSession`
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `String` (cuid) | PK | |
| `linkId` | `String` | FK → UploadLink.id | Enlace al que pertenece la sesión. |
| `tokenHash` | `String` | not null | Hash del token de sesión (cookie firmada). |
| `createdAt` | `DateTime` | default now | |
| `expiresAt` | `DateTime` | not null | Expiración de la sesión. |

> **Nota admin:** en v1 el administrador se autentica con una credencial de entorno (`ADMIN_PASSWORD`) y una sesión propia; no requiere tabla. Si en el futuro hay varios admins, se añade una tabla `AdminUser`.

---

## 4. Esquema Prisma (propuesto)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"   // "sqlite" en desarrollo local si se prefiere
  url      = env("DATABASE_URL")
}

model UploadLink {
  id           String        @id @default(cuid())
  name         String
  slug         String        @unique
  passwordHash String
  file         UploadedFile?
  sessions     ClientSession[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@index([createdAt])
}

model UploadedFile {
  id           String     @id @default(cuid())
  linkId       String     @unique
  link         UploadLink @relation(fields: [linkId], references: [id], onDelete: Cascade)
  originalName String
  extension    String
  sizeBytes    BigInt
  mimeType     String
  storageKey   String
  uploadedAt   DateTime   @default(now())
}

model ClientSession {
  id        String     @id @default(cuid())
  linkId    String
  link      UploadLink @relation(fields: [linkId], references: [id], onDelete: Cascade)
  tokenHash String
  createdAt DateTime   @default(now())
  expiresAt DateTime

  @@index([linkId])
}
```

### Reglas de integridad
- `onDelete: Cascade` en `UploadedFile` y `ClientSession` → al borrar el `UploadLink` se **revoca todo** (archivo + sesiones). El borrado del archivo físico se dispara en el servicio antes/junto al borrado del registro.
- `slug` único a nivel BD: si por improbable colisión de `nanoid` se intenta insertar un duplicado, la BD lo rechaza y el servicio reintenta.
- `linkId` único en `UploadedFile`: fuerza la relación 1:1 (un archivo por enlace en v1).
