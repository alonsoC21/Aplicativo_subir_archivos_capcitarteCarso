// Utilidades de formato compartidas (cliente y servidor).

/** Formatea bytes a una cadena legible (KB, MB, GB). */
export function formatearTamano(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const unidades = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const valor = bytes / Math.pow(1024, i);
  return `${valor.toFixed(valor >= 10 || i === 0 ? 0 : 1)} ${unidades[i]}`;
}

/** Devuelve "nombre" y "extensión" por separado de un nombre de archivo. */
export function nombreYExtension(nombre: string): {
  nombre: string;
  extension: string;
} {
  const idx = nombre.lastIndexOf(".");
  if (idx <= 0) return { nombre, extension: "" };
  return {
    nombre: nombre.slice(0, idx),
    extension: nombre.slice(idx + 1).toLowerCase(),
  };
}
