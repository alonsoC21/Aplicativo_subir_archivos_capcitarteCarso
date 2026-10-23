"use client";

import { useState } from "react";

import { Button, Card, Input, Label } from "@/components/ui";
import { Dropzone } from "./Dropzone";

type ArchivoMeta = {
  originalName: string;
  extension: string;
  sizeBytes: number;
};

export function EmpresaFlow({
  slug,
  autorizadoInicial,
  archivoInicial,
}: {
  slug: string;
  autorizadoInicial: boolean;
  archivoInicial: ArchivoMeta | null;
}) {
  const [autorizado, setAutorizado] = useState(autorizadoInicial);

  if (!autorizado) {
    return <LoginEmpresa slug={slug} onOk={() => setAutorizado(true)} />;
  }

  return <Dropzone slug={slug} archivoInicial={archivoInicial} />;
}

function LoginEmpresa({
  slug,
  onOk,
}: {
  slug: string;
  onOk: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const res = await fetch(`/api/auth/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error?.message ?? "Contraseña incorrecta");
        return;
      }
      onOk();
    } catch {
      setError("Error de red. Intente de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="password">Contraseña de acceso</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
        </div>
        {error && (
          <p className="rounded-carso bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <Button type="submit" disabled={cargando}>
          {cargando ? "Verificando..." : "Acceder"}
        </Button>
      </form>
    </Card>
  );
}
