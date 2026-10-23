// Implementación de StorageProvider sobre el sistema de archivos local.
// Guarda en STORAGE_LOCAL_DIR/<key>. La escritura es por streaming (pipe),
// de modo que archivos grandes (hasta 10 GB) no se cargan completos en memoria.

import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { Readable } from "node:stream";

import { env } from "@/lib/env";
import type { FileMeta, StorageProvider } from "./types";

export class LocalStorageProvider implements StorageProvider {
  private readonly baseDir: string;

  constructor(baseDir: string = env.storageLocalDir) {
    this.baseDir = path.resolve(process.cwd(), baseDir);
  }

  private resolveSafe(key: string): string {
    // Evita path traversal: la ruta resuelta debe quedar dentro de baseDir.
    const target = path.resolve(this.baseDir, key);
    if (target !== this.baseDir && !target.startsWith(this.baseDir + path.sep)) {
      throw new Error("Clave de almacenamiento inválida");
    }
    return target;
  }

  async save(key: string, stream: Readable, _meta: FileMeta): Promise<void> {
    const target = this.resolveSafe(key);
    await mkdir(path.dirname(target), { recursive: true });
    await pipeline(stream, createWriteStream(target));
  }

  async getStream(key: string): Promise<Readable> {
    const target = this.resolveSafe(key);
    return createReadStream(target);
  }

  async delete(key: string): Promise<void> {
    const target = this.resolveSafe(key);
    await rm(target, { force: true });
    // Limpia el directorio del enlace (ruta <slug>/...), exclusivo de ese enlace.
    // Se usa recursive para eliminarlo aunque conserve entradas residuales.
    const dirEnlace = path.dirname(target);
    if (dirEnlace !== this.baseDir) {
      try {
        await rm(dirEnlace, { recursive: true, force: true });
      } catch {
        // best-effort: no bloquear el borrado del registro por esto.
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const target = this.resolveSafe(key);
      await stat(target);
      return true;
    } catch {
      return false;
    }
  }
}
