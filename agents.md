# agents.md — Roles del Proyecto

> Portal de Transferencia Segura de Archivos — **Capacítate Carso**
> App Next.js 15 full-stack para subida de paquetes SCORM (ZIP) evadiendo bloqueos de firewall corporativo, alojada bajo `capacitatecarso.com/`.

Este archivo define los **roles de agente** (perfiles de trabajo especializados) que participan en el ciclo de vida del proyecto. Cada rol describe su responsabilidad, el alcance de archivos sobre los que trabaja, y las reglas que debe respetar. Sirve como guía tanto para colaboradores humanos como para asistentes de IA.

---

## Convenciones globales (aplican a todos los roles)

- **Lenguaje:** TypeScript estricto en todo el stack.
- **Stack:** Next.js 15 (App Router) + Prisma + PostgreSQL + Tailwind CSS.
- **Almacenamiento:** abstracción `StorageProvider`. Implementación actual = **disco local** (`/storage`). Futuro = **AWS S3** (sin cambiar la interfaz).
- **Dominio:** una sola app servida en `capacitatecarso.com/` (sin dependencias de terceros bloqueables).
- **Identidad visual:** replicar la paleta y tipografía de Capacítate Carso (teal `#00A6B4`, fondo `#EAF0F1`, header oscuro `#1C1C1C`).
- **Seguridad primero:** URLs no adivinables, contraseñas hasheadas (bcrypt/argon2), nunca exponer secretos en logs.
- **Comentarios de código:** en español.
- **Commits:** convención Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).

---

## 1. Arquitecto de Software (`@arquitecto`)

**Responsabilidad:** Define y mantiene la arquitectura general, decisiones técnicas (ADR) y la documentación SSD.

- **Alcance:** `/docs/**`, `agents.md`, `prisma/schema.prisma` (modelo de datos), estructura de carpetas.
- **Entrega:** documentos de arquitectura, modelo de BD, diseño de API, diagramas.
- **Reglas:**
  - Toda decisión que afecte escalabilidad (ej. almacenamiento) debe quedar documentada.
  - La capa de almacenamiento SIEMPRE se accede por interfaz, nunca directo al filesystem desde los handlers.
  - Mantiene la coherencia entre documentación y código.

## 2. Desarrollador Backend (`@backend`)

**Responsabilidad:** Implementa la lógica del servidor: API Routes / Route Handlers, servicios, acceso a datos y almacenamiento.

- **Alcance:** `src/app/api/**`, `src/server/**`, `src/lib/**`, `prisma/**`.
- **Entrega:** endpoints funcionales, servicios de dominio, migraciones Prisma.
- **Reglas:**
  - Validar toda entrada con Zod antes de tocar la BD.
  - Contraseñas: hashear al crear, comparar con función de tiempo constante.
  - Uploads pesados NO deben cargarse completos en memoria; usar streaming al `StorageProvider`.
  - Errores controlados: nunca filtrar stack traces al cliente.
  - Autorización por enlace: validar sesión/token antes de permitir subir o descargar.

## 3. Desarrollador Frontend (`@frontend`)

**Responsabilidad:** Construye la UI (admin y empresa) replicando la identidad visual de Capacítate Carso.

- **Alcance:** `src/app/**` (páginas/componentes de UI), `src/components/**`, `tailwind.config.ts`, estilos globales.
- **Entrega:** paneles de admin (lista/detalle/crear), vista de empresa (login + drag & drop + guardar).
- **Reglas:**
  - Fidelidad visual con las referencias: header teal, tipografía, botones redondeados.
  - Drag & Drop + click-to-browse; mostrar nombre y extensión del archivo.
  - Alertas de confirmación antes de acciones destructivas (eliminar URL).
  - Accesible (labels, foco, contraste) y responsivo.

## 4. Ingeniero de Seguridad (`@seguridad`)

**Responsabilidad:** Revisa autenticación, autorización, generación de secretos y manejo de archivos.

- **Alcance:** generación de URLs/passwords, middleware de auth, políticas de storage, validación de tipos de archivo.
- **Entrega:** revisión de amenazas, checklist OWASP, validación de que eliminar una URL revoca el acceso por completo.
- **Reglas:**
  - URLs: slug aleatorio ≥ 16 bytes (base62/nanoid), verificado único en BD.
  - Passwords generadas: longitud y entropía fuertes; hash en reposo.
  - Validar extensión y tipo MIME del upload (solo `.zip` / SCORM); límite de tamaño.
  - Al eliminar una URL: borrar registro, archivo físico y cualquier sesión asociada.

## 5. Ingeniero DevOps (`@devops`)

**Responsabilidad:** Configuración de entorno, build, variables, deploy y la futura migración a AWS S3.

- **Alcance:** `.env.example`, `package.json` scripts, `Dockerfile`/config de Vercel, migración storage local → S3.
- **Entrega:** entorno reproducible, scripts de migración de BD, guía de despliegue bajo el dominio Carso.
- **Reglas:**
  - Ningún secreto en el repo; todo por variables de entorno.
  - El cambio de storage local a S3 debe ser una variable de configuración, no un cambio de código de dominio.

## 6. QA / Tester (`@qa`)

**Responsabilidad:** Verifica los flujos end-to-end (admin crea → empresa sube → admin descarga/elimina).

- **Alcance:** pruebas manuales y automatizadas, validación contra criterios de aceptación.
- **Entrega:** casos de prueba, reporte de bugs.
- **Reglas:**
  - Probar unicidad de URLs, acceso denegado tras eliminación, integridad del ZIP descargado.
  - Verificar que archivos pesados suben sin agotar memoria.

---

## Flujo de colaboración

```
@arquitecto  ──► define docs SSD y modelo de datos
      │
      ▼
@backend + @frontend ──► implementan en paralelo sobre contratos de API
      │
      ▼
@seguridad ──► audita auth, secretos y storage
      │
      ▼
@qa ──► valida flujos E2E
      │
      ▼
@devops ──► despliega bajo capacitatecarso.com (y prepara migración a S3)
```
