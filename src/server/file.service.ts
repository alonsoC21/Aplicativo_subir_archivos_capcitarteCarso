// Servicio de dominio para archivos subidos (UploadedFile).
// Guarda el stream en el StorageProvider y registra/actualiza los metadatos.

import type { Readable } from "node:stream";

import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { extensionDe } from "@/lib/validation";

type GuardarArgs = {
  linkId: string;
  slug: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  stream: Readable;
};

/**
 * Guarda (o reemplaza) el archivo de un enlace. En v1 un enlace tiene como
 * máximo un archivo: si ya existe, se borra el anterior del storage y se
 * actualiza el registro.
 */
export async function guardarArchivo(args: GuardarArgs) {
  const { linkId, slug, originalName, mimeType, sizeBytes, stream } = args;
  const storage = getStorage();
  const extension = extensionDe(originalName);

  // Clave de almacenamiento: <slug>/<nombre-saneado>
  const nombreSeguro = originalName.replace(/[^\w.\-]+/g, "_");
  const storageKey = `${slug}/${nombreSeguro}`;

  // Si ya había archivo, borra el anterior (puede tener otra key).
  const anterior = await prisma.uploadedFile.findUnique({ where: { linkId } });
  if (anterior && anterior.storageKey !== storageKey) {
    try {
      await storage.delete(anterior.storageKey);
    } catch {
      // best-effort
    }
  }

  // Escribe el stream al storage (sin bufferizar en memoria).
  await storage.save(storageKey, stream, { originalName, mimeType, sizeBytes });

  // Upsert de metadatos.
  const registro = await prisma.uploadedFile.upsert({
    where: { linkId },
    create: {
      linkId,
      originalName,
      extension,
      sizeBytes: BigInt(sizeBytes),
      mimeType,
      storageKey,
    },
    update: {
      originalName,
      extension,
      sizeBytes: BigInt(sizeBytes),
      mimeType,
      storageKey,
      uploadedAt: new Date(),
    },
  });

  return {
    originalName: registro.originalName,
    extension: registro.extension,
    sizeBytes: Number(registro.sizeBytes),
    uploadedAt: registro.uploadedAt,
  };
}

/** Devuelve el stream y metadatos del archivo de un enlace (para descarga). */
export async function obtenerArchivoDescarga(linkId: string) {
  const registro = await prisma.uploadedFile.findUnique({ where: { linkId } });
  if (!registro) return null;

  const stream = await getStorage().getStream(registro.storageKey);
  return {
    stream,
    originalName: registro.originalName,
    mimeType: registro.mimeType,
    sizeBytes: Number(registro.sizeBytes),
  };
}

/** Metadatos del archivo actual de un enlace por slug (para confirmación). */
export async function estadoArchivoPorLink(linkId: string) {
  const registro = await prisma.uploadedFile.findUnique({ where: { linkId } });
  if (!registro) return null;
  return {
    originalName: registro.originalName,
    extension: registro.extension,
    sizeBytes: Number(registro.sizeBytes),
    uploadedAt: registro.uploadedAt,
  };
}
