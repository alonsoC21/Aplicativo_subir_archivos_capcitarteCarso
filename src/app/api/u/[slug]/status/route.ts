// GET /api/u/:slug/status — indica si el enlace existe (para la UI de empresa).
// Devuelve 404 idéntico tanto si nunca existió como si fue revocado.

import { errores, ok } from "@/lib/api";
import { buscarPorSlug } from "@/server/link.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const link = await buscarPorSlug(slug);
  if (!link) return errores.noEncontrado("Enlace no disponible");
  return ok({ exists: true, name: link.name });
}
