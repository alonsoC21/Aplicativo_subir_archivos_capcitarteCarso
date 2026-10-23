// POST /api/auth/:slug — autenticación de la empresa con la contraseña del enlace.

import { NextRequest } from "next/server";

import { crearSesionCliente } from "@/lib/auth";
import { errores, ok } from "@/lib/api";
import { authLinkSchema } from "@/lib/validation";
import { buscarPorSlug, verificarPasswordLink } from "@/server/link.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // El enlace debe existir (respuesta 404 no distingue revocado de inexistente).
  const link = await buscarPorSlug(slug);
  if (!link) return errores.noEncontrado("Enlace no disponible");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errores.validacion("Cuerpo JSON inválido");
  }

  const parsed = authLinkSchema.safeParse(body);
  if (!parsed.success) {
    return errores.validacion(
      parsed.error.issues[0]?.message ?? "Datos inválidos"
    );
  }

  const valido = await verificarPasswordLink(slug, parsed.data.password);
  if (!valido) return errores.prohibido("Contraseña incorrecta");

  await crearSesionCliente(slug);
  return ok({ authenticated: true });
}
