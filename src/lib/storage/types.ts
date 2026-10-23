// Contrato del proveedor de almacenamiento. Toda la aplicación accede a los
// archivos SOLO a través de esta interfaz, de modo que migrar de disco local
// a AWS S3 no requiera tocar la lógica de dominio (ver ADR-002).

import type { Readable } from "node:stream";

export interface FileMeta {
  originalName: string;
  mimeType: string;
  sizeBytes?: number;
}

export interface StorageProvider {
  /** Guarda un stream bajo la clave dada. */
  save(key: string, stream: Readable, meta: FileMeta): Promise<void>;
  /** Devuelve un stream de lectura del archivo. */
  getStream(key: string): Promise<Readable>;
  /** Elimina el archivo (no falla si no existe). */
  delete(key: string): Promise<void>;
  /** Indica si existe el archivo. */
  exists(key: string): Promise<boolean>;
}
