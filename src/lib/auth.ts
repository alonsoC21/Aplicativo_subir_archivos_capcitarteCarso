// Gestión de sesiones mediante JWT firmados (jose) almacenados en cookies
// HttpOnly. Hay dos tipos de sesión: 'admin' y 'client' (ligada a un slug).

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import { env } from "@/lib/env";

const secret = new TextEncoder().encode(env.sessionSecret);

export const ADMIN_COOKIE = "admin_session";
export const CLIENT_COOKIE = "client_session";

const DURACION_ADMIN = 60 * 60 * 8; // 8 horas
const DURACION_CLIENTE = 60 * 60 * 2; // 2 horas

type AdminPayload = { tipo: "admin"; user: string };
type ClientPayload = { tipo: "client"; slug: string };

async function firmar(
  payload: AdminPayload | ClientPayload,
  segundos: number
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${segundos}s`)
    .sign(secret);
}

// ----------------- Admin -----------------

export async function crearSesionAdmin(user: string): Promise<void> {
  const token = await firmar({ tipo: "admin", user }, DURACION_ADMIN);
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: DURACION_ADMIN,
  });
}

export async function obtenerSesionAdmin(): Promise<AdminPayload | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.tipo !== "admin") return null;
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

export async function cerrarSesionAdmin(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

// ----------------- Cliente (empresa) -----------------

export async function crearSesionCliente(slug: string): Promise<void> {
  const token = await firmar({ tipo: "client", slug }, DURACION_CLIENTE);
  const store = await cookies();
  store.set(CLIENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: DURACION_CLIENTE,
  });
}

export async function obtenerSesionCliente(): Promise<ClientPayload | null> {
  const store = await cookies();
  const token = store.get(CLIENT_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.tipo !== "client") return null;
    return payload as unknown as ClientPayload;
  } catch {
    return null;
  }
}

/** Verifica que la sesión de cliente corresponde al slug solicitado. */
export async function clienteAutorizado(slug: string): Promise<boolean> {
  const sesion = await obtenerSesionCliente();
  return sesion?.slug === slug;
}
