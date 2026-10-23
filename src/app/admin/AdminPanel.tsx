"use client";

import { useCallback, useEffect, useState } from "react";

import { Button, Card } from "@/components/ui";
import { formatearTamano } from "@/lib/format";
import { CrearLinkModal } from "./CrearLinkModal";

type LinkItem = {
  id: string;
  name: string;
  slug: string;
  url: string;
  hasFile: boolean;
  createdAt: string;
};

type Detalle = {
  id: string;
  name: string;
  slug: string;
  url: string;
  file: {
    originalName: string;
    extension: string;
    sizeBytes: number;
    uploadedAt: string;
  } | null;
};

export function AdminPanel() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargarLista = useCallback(async () => {
    setCargando(true);
    const res = await fetch("/api/admin/links");
    if (res.ok) {
      const data = await res.json();
      setLinks(data.links);
    }
    setCargando(false);
  }, []);

  const cargarDetalle = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/links/${id}`);
    if (res.ok) {
      setDetalle(await res.json());
    } else {
      setDetalle(null);
    }
  }, []);

  useEffect(() => {
    cargarLista();
  }, [cargarLista]);

  useEffect(() => {
    if (seleccionadoId) cargarDetalle(seleccionadoId);
    else setDetalle(null);
  }, [seleccionadoId, cargarDetalle]);

  async function eliminar(id: string) {
    const confirmar = window.confirm(
      "¿Eliminar esta URL? El acceso de la empresa quedará revocado por completo y el archivo se borrará. Esta acción no se puede deshacer."
    );
    if (!confirmar) return;

    const res = await fetch(`/api/admin/links/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSeleccionadoId(null);
      setDetalle(null);
      await cargarLista();
    } else {
      alert("No se pudo eliminar la URL.");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[320px_1fr]">
      {/* Panel izquierdo: Lista de URLs */}
      <Card className="h-fit">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-carso-text">Lista URLs</h2>
          <Button onClick={() => setModalAbierto(true)} className="px-3 py-1.5">
            + Nueva
          </Button>
        </div>

        {cargando ? (
          <p className="text-sm text-carso-textSoft">Cargando...</p>
        ) : links.length === 0 ? (
          <p className="text-sm text-carso-textSoft">
            No hay URLs. Crea una con “+ Nueva”.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {links.map((l) => (
              <li key={l.id}>
                <button
                  onClick={() => setSeleccionadoId(l.id)}
                  className={`flex w-full items-center justify-between rounded-carso px-3 py-2 text-left text-sm transition ${
                    seleccionadoId === l.id
                      ? "bg-carso-teal text-white"
                      : "text-carso-text hover:bg-carso-bgSoft"
                  }`}
                >
                  <span className="truncate">{l.name}</span>
                  {l.hasFile && (
                    <span
                      title="Tiene archivo cargado"
                      className={`ml-2 inline-block h-2 w-2 shrink-0 rounded-full ${
                        seleccionadoId === l.id ? "bg-white" : "bg-carso-teal"
                      }`}
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Panel derecho: Detalle */}
      <Card>
        {!detalle ? (
          <div className="flex h-full min-h-[240px] items-center justify-center text-center text-carso-textSoft">
            Selecciona una URL de la lista para ver su detalle.
          </div>
        ) : (
          <DetalleUrl detalle={detalle} onEliminar={() => eliminar(detalle.id)} />
        )}
      </Card>

      {modalAbierto && (
        <CrearLinkModal
          onCerrar={() => setModalAbierto(false)}
          onCreado={async () => {
            await cargarLista();
          }}
        />
      )}
    </div>
  );
}

function DetalleUrl({
  detalle,
  onEliminar,
}: {
  detalle: Detalle;
  onEliminar: () => void;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiarUrl() {
    await navigator.clipboard.writeText(detalle.url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-carso-text">{detalle.name}</h2>

      <Campo label="URL">
        <div className="flex items-center gap-2">
          <code className="flex-1 break-all rounded bg-carso-bgSoft px-2 py-1 text-xs text-carso-text">
            {detalle.url}
          </code>
          <button
            onClick={copiarUrl}
            className="shrink-0 rounded-carso border border-carso-teal px-2 py-1 text-xs text-carso-teal hover:bg-carso-bgSoft"
          >
            {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>
      </Campo>

      <Campo label="Pass">
        <span className="text-sm text-carso-textSoft">
          •••••••••••• (oculta por seguridad)
        </span>
      </Campo>

      <Campo label="Archivo">
        {detalle.file ? (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-carso-text">
              {detalle.file.originalName}
            </span>
            <span className="text-xs text-carso-textSoft">
              .{detalle.file.extension} ·{" "}
              {formatearTamano(detalle.file.sizeBytes)}
            </span>
          </div>
        ) : (
          <span className="text-sm text-carso-textSoft">
            Sin archivo cargado todavía.
          </span>
        )}
      </Campo>

      <div className="mt-2 flex gap-3">
        {detalle.file && (
          <a
            href={`/api/admin/links/${detalle.id}/file`}
            className="inline-flex items-center justify-center gap-2 rounded-carso border border-carso-teal bg-white px-4 py-2 text-sm font-semibold text-carso-teal hover:bg-carso-bgSoft"
          >
            Descargar
          </a>
        )}
        <Button variant="danger" onClick={onEliminar}>
          Eliminar
        </Button>
      </div>
    </div>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-carso-textSoft">
        {label}
      </span>
      {children}
    </div>
  );
}
