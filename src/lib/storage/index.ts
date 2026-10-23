// Fábrica del proveedor de almacenamiento. Selecciona la implementación según
// STORAGE_DRIVER. Hoy solo 'local'; 'S3StorageProvider' se añadirá para AWS
// sin cambiar los consumidores de StorageProvider.

import { env } from "@/lib/env";
import { LocalStorageProvider } from "./local-provider";
import type { StorageProvider } from "./types";

let instancia: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (instancia) return instancia;

  switch (env.storageDriver) {
    case "local":
      instancia = new LocalStorageProvider();
      break;
    case "s3":
      // Futuro: return new S3StorageProvider(...)
      throw new Error("STORAGE_DRIVER=s3 aún no implementado");
    default:
      throw new Error(`STORAGE_DRIVER desconocido: ${env.storageDriver}`);
  }

  return instancia;
}

export type { StorageProvider } from "./types";
