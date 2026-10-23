// /api/admin/links
//   POST  -> crear enlace (slug + password autogenerados)
//   GET   -> listar enlaces

import { NextRequest } from "next/server";

import { obtenerSesionAdmin } from "@/lib/auth";
import { errores, ok } from "@/lib/api";
import { crearLinkSchema } from "@/lib/validation";
import { crearLink, listarLinks } from "@/server/link.service";

export async function GET() {
  if (!(await obtenerSesionAdmin())) return errores.noAutenticado();
  const links = await listarLinks();
  return ok({ links });
}

export async function POST(req: NextRequest) {
  if (!(await obtenerSesionAdmin())) return errores.noAutenticado();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errores.validacion("Cuerpo JSON inválido");
  }

  const parsed = crearLinkSchema.safeParse(body);
  if (!parsed.success) {
    return errores.validacion(
      parsed.error.issues[0]?.message ?? "Datos inválidos"
    );
  }

  const link = await crearLink(parsed.data.name);
  return ok(link, 201);
}
