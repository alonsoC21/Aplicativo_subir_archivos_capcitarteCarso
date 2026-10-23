// Servicio de dominio para enlaces de subida (UploadLink).
// Encapsula creación con slug/password únicos, listado, detalle y eliminación
// con revocación total (archivo físico + registros en cascada).

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import {
  generarPassword,
  generarSlug,
  hashPassword,
  verificarPassword,
} from "@/lib/crypto";
import { getStorage } from "@/lib/storage";

export type LinkCreado = {
  id: string;
  name: string;
  slug: string;
  url: string;
  password: string; // en claro, solo al crear
  createdAt: Date;
};

function construirUrl(slug: string): string {
  return `${env.publicBaseUrl.replace(/\/$/, "")}/u/${slug}`;
}

/** Crea un enlace con slug y contraseña generados, garantizando unicidad. */
export async function crearLink(name: string): Promise<LinkCreado> {
  const password = generarPassword();
  const passwordHash = await hashPassword(password);

  // Reintenta ante la improbable colisión de slug (unicidad forzada en BD).
  for (let intento = 0; intento < 5; intento++) {
    const slug = generarSlug();
    const existe = await prisma.uploadLink.findUnique({ where: { slug } });
    if (existe) continue;

    const link = await prisma.uploadLink.create({
      data: { name, slug, passwordHash },
    });

    return {
      id: link.id,
      name: link.name,
      slug: link.slug,
      url: construirUrl(link.slug),
      password,
      createdAt: link.createdAt,
    };
  }

  throw new Error("No se pudo generar un slug único, intente de nuevo");
}

/** Lista todos los enlaces con indicador de si tienen archivo. */
export async function listarLinks() {
  const links = await prisma.uploadLink.findMany({
    orderBy: { createdAt: "desc" },
    include: { file: { select: { id: true } } },
  });

  return links.map((l) => ({
    id: l.id,
    name: l.name,
    slug: l.slug,
    url: construirUrl(l.slug),
    hasFile: l.file !== null,
    createdAt: l.createdAt,
  }));
}

/** Detalle de un enlace por id, incluyendo metadatos del archivo (sin password). */
export async function detalleLink(id: string) {
  const link = await prisma.uploadLink.findUnique({
    where: { id },
    include: { file: true },
  });
  if (!link) return null;

  return {
    id: link.id,
    name: link.name,
    slug: link.slug,
    url: construirUrl(link.slug),
    file: link.file
      ? {
          originalName: link.file.originalName,
          extension: link.file.extension,
          sizeBytes: Number(link.file.sizeBytes),
          uploadedAt: link.file.uploadedAt,
        }
      : null,
  };
}

/** Busca un enlace por slug (uso del flujo de empresa). */
export async function buscarPorSlug(slug: string) {
  return prisma.uploadLink.findUnique({
    where: { slug },
    include: { file: true },
  });
}

/** Verifica la contraseña de un enlace. */
export async function verificarPasswordLink(
  slug: string,
  password: string
): Promise<boolean> {
  const link = await prisma.uploadLink.findUnique({ where: { slug } });
  if (!link) return false;
  return verificarPassword(password, link.passwordHash);
}

/** Elimina un enlace y revoca TODO acceso: archivo físico + registros (cascade). */
export async function eliminarLink(id: string): Promise<boolean> {
  const link = await prisma.uploadLink.findUnique({
    where: { id },
    include: { file: true },
  });
  if (!link) return false;

  // Borra primero el archivo físico del storage.
  if (link.file) {
    try {
      await getStorage().delete(link.file.storageKey);
    } catch {
      // Continúa con el borrado del registro aunque el archivo físico falle.
    }
  }

  // El borrado del registro elimina en cascada file y sessions.
  await prisma.uploadLink.delete({ where: { id } });
  return true;
}
