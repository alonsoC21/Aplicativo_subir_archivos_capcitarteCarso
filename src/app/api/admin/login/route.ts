// POST /api/admin/login — autenticación del administrador con credencial de entorno.

import { NextRequest } from "next/server";

import { crearSesionAdmin } from "@/lib/auth";
import { env } from "@/lib/env";
import { errores, ok } from "@/lib/api";
import { loginAdminSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errores.validacion("Cuerpo JSON inválido");
  }

  const parsed = loginAdminSchema.safeParse(body);
  if (!parsed.success) {
    return errores.validacion(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const { user, password } = parsed.data;
  if (user !== env.adminUser || password !== env.adminPassword) {
    return errores.prohibido("Usuario o contraseña incorrectos");
  }

  await crearSesionAdmin(user);
  return ok({ authenticated: true });
}
