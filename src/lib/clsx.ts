// Pequeña utilidad para combinar clases condicionales sin dependencias externas.
export function clsx(
  ...clases: Array<string | false | null | undefined>
): string {
  return clases.filter(Boolean).join(" ");
}
