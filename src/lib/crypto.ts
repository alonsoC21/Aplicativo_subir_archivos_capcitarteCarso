// Utilidades criptográficas: generación de slugs no adivinables, contraseñas
// seguras y hashing de contraseñas con bcrypt.

import bcrypt from "bcryptjs";
import { customAlphabet, nanoid } from "nanoid";

// Alfabeto sin caracteres ambiguos para contraseñas legibles.
const ALFABETO_PASS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const generarPass = customAlphabet(ALFABETO_PASS, 12);

/** Slug de URL no adivinable (~126 bits de entropía). */
export function generarSlug(): string {
  return nanoid(21);
}

/** Contraseña aleatoria de 12 caracteres sin ambigüedades. */
export function generarPassword(): string {
  return generarPass();
}

/** Hashea una contraseña con bcrypt. */
export async function hashPassword(plano: string): Promise<string> {
  return bcrypt.hash(plano, 10);
}

/** Compara contraseña en claro contra su hash (tiempo constante vía bcrypt). */
export async function verificarPassword(
  plano: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plano, hash);
}
