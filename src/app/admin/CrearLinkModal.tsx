"use client";

import { useState } from "react";

import { Button, Input, Label } from "@/components/ui";

type Creado = {
  name: string;
  url: string;
  password: string;
};

export function CrearLinkModal({
  onCerrar,
  onCreado,
}: {
  onCerrar: () => void;
  onCreado: () => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [creado, setCreado] = useState<Creado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/admin/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error?.message ?? "No se pudo crear la URL");
        return;
      }
      setCreado({ name: data.name, url: data.url, password: data.password });
      await onCreado();
    } catch {
      setError("Error de red. Intente de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-md rounded-carso bg-white p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-carso-text">
            {creado ? "URL creada" : "Nueva URL"}
          </h2>
          <button
            onClick={onCerrar}
            className="text-xl leading-none text-carso-textSoft hover:text-carso-text"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {!creado ? (
          <form onSubmit={crear} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="name">Nombre identificador</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Empresa Ejemplo S.A."
                required
                autoFocus
              />
            </div>
            {error && (
              <p className="rounded-carso bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onCerrar}>
                Cancelar
              </Button>
              <Button type="submit" disabled={cargando}>
                {cargando ? "Creando..." : "Crear"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="rounded-carso bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Guarda la contraseña ahora: por seguridad no se volverá a mostrar.
            </p>
            <CampoCopiable label="Nombre" valor={creado.name} copiable={false} />
            <CampoCopiable label="URL" valor={creado.url} />
            <CampoCopiable label="Contraseña" valor={creado.password} />
            <div className="flex justify-end">
              <Button onClick={onCerrar}>Listo</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CampoCopiable({
  label,
  valor,
  copiable = true,
}: {
  label: string;
  valor: string;
  copiable?: boolean;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(valor);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-carso-textSoft">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <code className="flex-1 break-all rounded bg-carso-bgSoft px-2 py-1 text-sm text-carso-text">
          {valor}
        </code>
        {copiable && (
          <button
            onClick={copiar}
            className="shrink-0 rounded-carso border border-carso-teal px-2 py-1 text-xs text-carso-teal hover:bg-carso-bgSoft"
          >
            {copiado ? "Copiado" : "Copiar"}
          </button>
        )}
      </div>
    </div>
  );
}
