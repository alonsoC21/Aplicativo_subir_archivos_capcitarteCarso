// Esquemas de validación Zod para las entradas de la API.

import { z } from "zod";

export const crearLinkSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre es demasiado largo"),
});

export const loginAdminSchema = z.object({
  user: z.string().trim().min(1, "Usuario requerido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export const authLinkSchema = z.object({
  password: z.string().min(1, "Contraseña requerida"),
});

// Validación de archivo SCORM (ZIP).
export const EXTENSIONES_PERMITIDAS = ["zip"] as const;
export const MIME_PERMITIDOS = [
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream", // algunos navegadores envían esto para .zip
] as const;

export function extensionDe(nombre: string): string {
  const partes = nombre.split(".");
  return partes.length > 1 ? partes.pop()!.toLowerCase() : "";
}

export function esArchivoPermitido(
  nombre: string,
  mime: string
): { ok: boolean; motivo?: string } {
  const ext = extensionDe(nombre);
  if (!EXTENSIONES_PERMITIDAS.includes(ext as (typeof EXTENSIONES_PERMITIDAS)[number])) {
    return { ok: false, motivo: "Solo se permiten archivos .zip (SCORM)" };
  }
  if (!MIME_PERMITIDOS.includes(mime as (typeof MIME_PERMITIDOS)[number])) {
    return { ok: false, motivo: "Tipo de archivo no válido" };
  }
  return { ok: true };
}
