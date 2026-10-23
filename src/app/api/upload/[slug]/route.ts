// /api/upload/:slug
//   POST -> sube (o reemplaza) el archivo ZIP del enlace mediante streaming.
//   GET  -> estado del archivo actual (para pantalla de confirmación).
//
// El archivo se recibe por streaming y se escribe directo al StorageProvider,
// de modo que archivos de hasta 10 GB no se cargan completos en memoria.

import { Readable } from "node:stream";

import { clienteAutorizado } from "@/lib/auth";
import { env } from "@/lib/env";
import { errores, error, ok } from "@/lib/api";
import { esArchivoPermitido } from "@/lib/validation";
import { buscarPorSlug } from "@/server/link.service";
import { estadoArchivoPorLink, guardarArchivo } from "@/server/file.service";

// Permite cuerpos grandes y ejecución prolongada en Node runtime.
export const runtime = "nodejs";
export const maxDuration = 3600;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!(await clienteAutorizado(slug))) return errores.noAutenticado();

  const link = await buscarPorSlug(slug);
  if (!link) return errores.noEncontrado("Enlace no disponible");

  const estado = await estadoArchivoPorLink(link.id);
  return ok({ file: estado });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!(await clienteAutorizado(slug))) return errores.noAutenticado();

  const link = await buscarPorSlug(slug);
  if (!link) return errores.noEncontrado("Enlace no disponible");

  // Metadatos vía cabeceras (el cuerpo es el binario crudo del archivo).
  const originalName = decodeURIComponent(
    req.headers.get("x-file-name") ?? ""
  ).trim();
  const mimeType =
    req.headers.get("content-type") || "application/octet-stream";

  if (!originalName) {
    return errores.validacion("Falta el nombre del archivo (x-file-name)");
  }

  // Validación de extensión y tipo (solo .zip / SCORM).
  const permitido = esArchivoPermitido(originalName, mimeType);
  if (!permitido.ok) {
    return error("UNSUPPORTED_MEDIA_TYPE", permitido.motivo!, 415);
  }

  // Validación de tamaño por cabecera Content-Length (si viene).
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > env.maxUploadBytes) {
    return error(
      "PAYLOAD_TOO_LARGE",
      `El archivo supera el límite de ${Math.round(
        env.maxUploadBytes / (1024 * 1024 * 1024)
      )} GB`,
      413
    );
  }

  if (!req.body) {
    return errores.validacion("No se recibió contenido");
  }

  // Convierte el ReadableStream web del request a un Readable de Node y lo
  // pasa por streaming al servicio -> StorageProvider.
  const nodeStream = Readable.fromWeb(
    req.body as unknown as import("node:stream/web").ReadableStream<Uint8Array>
  );

  try {
    const resultado = await guardarArchivo({
      linkId: link.id,
      slug,
      originalName,
      mimeType,
      sizeBytes: contentLength,
      stream: nodeStream,
    });
    return ok({ file: resultado }, 201);
  } catch (e) {
    console.error("Error al guardar archivo:", e);
    return errores.interno();
  }
}
