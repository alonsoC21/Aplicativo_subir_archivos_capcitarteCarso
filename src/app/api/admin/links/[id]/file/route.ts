// GET /api/admin/links/:id/file — descarga del archivo del enlace (streaming).

import { Readable } from "node:stream";

import { obtenerSesionAdmin } from "@/lib/auth";
import { errores } from "@/lib/api";
import { obtenerArchivoDescarga } from "@/server/file.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await obtenerSesionAdmin())) return errores.noAutenticado();

  const { id } = await params;
  const archivo = await obtenerArchivoDescarga(id);
  if (!archivo) return errores.noEncontrado("No hay archivo para este enlace");

  // Convierte el Readable de Node a un ReadableStream web para la Response.
  const webStream = Readable.toWeb(
    archivo.stream
  ) as unknown as ReadableStream<Uint8Array>;

  const nombreSeguro = encodeURIComponent(archivo.originalName);
  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": archivo.mimeType || "application/octet-stream",
      "Content-Length": String(archivo.sizeBytes),
      "Content-Disposition": `attachment; filename="${archivo.originalName.replace(
        /"/g,
        ""
      )}"; filename*=UTF-8''${nombreSeguro}`,
    },
  });
}
