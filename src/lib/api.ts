// Helpers para respuestas JSON de la API con formato de error consistente.

import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export const errores = {
  noAutenticado: () => error("UNAUTHENTICATED", "No autenticado", 401),
  prohibido: (msg = "Acceso denegado") => error("FORBIDDEN", msg, 403),
  noEncontrado: (msg = "Recurso no encontrado") =>
    error("NOT_FOUND", msg, 404),
  validacion: (msg: string) => error("VALIDATION_ERROR", msg, 400),
  interno: () => error("INTERNAL_ERROR", "Error interno del servidor", 500),
};
