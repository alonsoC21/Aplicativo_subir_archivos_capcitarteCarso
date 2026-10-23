// POST /api/admin/logout — cierra la sesión del administrador.

import { cerrarSesionAdmin } from "@/lib/auth";
import { ok } from "@/lib/api";

export async function POST() {
  await cerrarSesionAdmin();
  return ok({ loggedOut: true });
}
