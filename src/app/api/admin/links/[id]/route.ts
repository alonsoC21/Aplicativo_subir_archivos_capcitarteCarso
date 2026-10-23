// /api/admin/links/:id
//   GET    -> detalle del enlace
//   DELETE -> eliminar enlace (revocación total)

import { obtenerSesionAdmin } from "@/lib/auth";
import { errores, ok } from "@/lib/api";
import { detalleLink, eliminarLink } from "@/server/link.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await obtenerSesionAdmin())) return errores.noAutenticado();

  const { id } = await params;
  const detalle = await detalleLink(id);
  if (!detalle) return errores.noEncontrado("Enlace no encontrado");
  return ok(detalle);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await obtenerSesionAdmin())) return errores.noAutenticado();

  const { id } = await params;
  const borrado = await eliminarLink(id);
  if (!borrado) return errores.noEncontrado("Enlace no encontrado");
  return ok({ deleted: true });
}
