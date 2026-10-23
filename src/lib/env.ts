// Carga y valida las variables de entorno necesarias.
// Centraliza el acceso a la configuración para no leer process.env disperso.

function requerido(nombre: string, valor: string | undefined): string {
  if (!valor || valor.trim() === "") {
    throw new Error(`Variable de entorno faltante: ${nombre}`);
  }
  return valor;
}

export const env = {
  databaseUrl: requerido("DATABASE_URL", process.env.DATABASE_URL),
  adminUser: process.env.ADMIN_USER ?? "admin",
  adminPassword: requerido("ADMIN_PASSWORD", process.env.ADMIN_PASSWORD),
  sessionSecret: requerido("SESSION_SECRET", process.env.SESSION_SECRET),
  storageDriver: (process.env.STORAGE_DRIVER ?? "local") as "local" | "s3",
  storageLocalDir: process.env.STORAGE_LOCAL_DIR ?? "./storage",
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? "10737418240"), // 10 GB
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "http://localhost:3000",
};
