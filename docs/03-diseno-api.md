# SSD — Documento 03: Diseño de la API

> Proyecto: **Portal de Transferencia Segura de Archivos — Capacítate Carso**
> Base: Next.js 15 Route Handlers bajo `capacitatecarso.com/api`

---

## 1. Convenciones

- **Formato:** JSON para request/response (excepto upload = `multipart/stream`, download = binario).
- **Autenticación:**
  - **Admin:** cookie de sesión de administrador (`admin_session`), requerida en todas las rutas `/api/admin/*`.
  - **Empresa:** cookie de sesión de cliente (`client_session`) ligada al `slug`, requerida para subir/descargar en su enlace.
- **Errores:** cuerpo `{ "error": { "code": string, "message": string } }`. Nunca se devuelven stack traces.
- **Validación:** toda entrada se valida con Zod antes de ejecutar lógica.

### Códigos de estado
| Código | Uso |
|--------|-----|
| 200 | OK |
| 201 | Recurso creado |
| 400 | Validación fallida |
| 401 | No autenticado |
| 403 | Autenticado pero sin permiso / contraseña incorrecta |
| 404 | Enlace o recurso no existe (o fue revocado) |
| 409 | Conflicto (p. ej. ya existe archivo) |
| 413 | Archivo demasiado grande |
| 415 | Tipo de archivo no permitido |
| 500 | Error interno |

---

## 2. Endpoints de Administrador

Todos requieren sesión de admin. Prefijo: `/api/admin`.

### 2.1 Crear enlace
`POST /api/admin/links`

Genera slug y contraseña automáticamente, garantizando unicidad.

**Request**
```json
{ "name": "Empresa Ejemplo S.A." }
```

**Response 201**
```json
{
  "id": "clx...",
  "name": "Empresa Ejemplo S.A.",
  "slug": "V1StGXR8_Z5jdHi6B-myT",
  "url": "https://capacitatecarso.com/u/V1StGXR8_Z5jdHi6B-myT",
  "password": "Xk9#mP2vQz7L",
  "createdAt": "2026-10-23T10:00:00Z"
}
```
> `password` en claro se devuelve **solo** en esta respuesta de creación. Después solo existe su hash.

### 2.2 Listar enlaces
`GET /api/admin/links`

**Response 200**
```json
{
  "links": [
    {
      "id": "clx...",
      "name": "Empresa Ejemplo S.A.",
      "slug": "V1StGXR8_Z5jdHi6B-myT",
      "url": "https://capacitatecarso.com/u/V1StGXR8_Z5jdHi6B-myT",
      "hasFile": true,
      "createdAt": "2026-10-23T10:00:00Z"
    }
  ]
}
```

### 2.3 Detalle de enlace
`GET /api/admin/links/:id`

**Response 200**
```json
{
  "id": "clx...",
  "name": "Empresa Ejemplo S.A.",
  "slug": "V1StGXR8_Z5jdHi6B-myT",
  "url": "https://capacitatecarso.com/u/V1StGXR8_Z5jdHi6B-myT",
  "file": {
    "originalName": "curso-seguridad.zip",
    "extension": "zip",
    "sizeBytes": 157286400,
    "uploadedAt": "2026-10-23T12:30:00Z"
  }
}
```
> Si no hay archivo: `"file": null`. Nunca se devuelve la contraseña ni su hash.

### 2.4 Descargar archivo del enlace
`GET /api/admin/links/:id/file`

- Devuelve el binario con `Content-Disposition: attachment; filename="<originalName>"`.
- Stream desde el `StorageProvider` (no se carga completo en memoria).
- 404 si no hay archivo.

### 2.5 Eliminar enlace (revocación total)
`DELETE /api/admin/links/:id`

- Borra archivo físico del storage + registro `UploadedFile` + `ClientSession` (cascade) + `UploadLink`.
- Tras esto, cualquier acceso al `slug` responde 404.

**Response 200**
```json
{ "deleted": true }
```

---

## 3. Endpoints de Empresa (Cliente)

Prefijo: `/api`. Operan sobre un `slug`.

### 3.1 Estado del enlace (público mínimo)
`GET /api/u/:slug/status`

Permite a la UI saber si el enlace existe antes de pedir contraseña.

**Response 200**
```json
{ "exists": true, "name": "Empresa Ejemplo S.A." }
```
> 404 si el enlace fue revocado o nunca existió.

### 3.2 Autenticación del enlace
`POST /api/auth/:slug`

**Request**
```json
{ "password": "Xk9#mP2vQz7L" }
```

**Response 200** — emite cookie `client_session` (HttpOnly, Secure, SameSite=Strict).
```json
{ "authenticated": true }
```
> 403 si la contraseña es incorrecta. Comparación en tiempo constante.

### 3.3 Subir archivo
`POST /api/upload/:slug`  — requiere `client_session` válida.

- `Content-Type: multipart/form-data` (campo `file`) recibido por **streaming** hacia el `StorageProvider`.
- Validaciones: extensión `.zip`, MIME permitido, tamaño ≤ `MAX_UPLOAD_MB`.
- Si ya existe archivo en el enlace, se reemplaza (o 409 según política; v1: reemplaza).

**Response 201**
```json
{
  "file": {
    "originalName": "curso-seguridad.zip",
    "extension": "zip",
    "sizeBytes": 157286400,
    "uploadedAt": "2026-10-23T12:30:00Z"
  }
}
```
> 413 si excede tamaño; 415 si el tipo no está permitido.

### 3.4 Confirmar / estado del archivo subido
`GET /api/upload/:slug`  — requiere `client_session`.

Devuelve metadatos del archivo actual (para la pantalla de confirmación "nombre + extensión").

---

## 4. Reglas de seguridad transversales

1. **Rate limiting** en `/api/auth/:slug` para frenar fuerza bruta sobre la contraseña.
2. **Slug no adivinable** (`nanoid(21)`); respuestas 404 idénticas para "no existe" y "revocado" (no filtrar existencia).
3. **Cabeceras:** HSTS, `X-Content-Type-Options: nosniff`, CSP básica.
4. **Validación de archivo doble:** por extensión y por MIME; rechazar si no coinciden con ZIP/SCORM.
5. **Sin secretos en logs:** nunca registrar contraseñas, tokens ni rutas completas de storage con datos sensibles.

---

## 5. Mapa de rutas (resumen)

| Método | Ruta | Actor | Descripción |
|--------|------|-------|-------------|
| POST | `/api/admin/links` | Admin | Crear enlace (slug + password auto) |
| GET | `/api/admin/links` | Admin | Listar enlaces |
| GET | `/api/admin/links/:id` | Admin | Detalle de enlace |
| GET | `/api/admin/links/:id/file` | Admin | Descargar archivo |
| DELETE | `/api/admin/links/:id` | Admin | Eliminar enlace (revoca acceso) |
| GET | `/api/u/:slug/status` | Empresa | ¿Existe el enlace? |
| POST | `/api/auth/:slug` | Empresa | Autenticar con contraseña |
| POST | `/api/upload/:slug` | Empresa | Subir ZIP (streaming) |
| GET | `/api/upload/:slug` | Empresa | Estado del archivo subido |
