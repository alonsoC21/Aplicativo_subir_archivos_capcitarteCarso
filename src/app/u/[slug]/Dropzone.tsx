"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui";
import { formatearTamano, nombreYExtension } from "@/lib/format";

type ArchivoMeta = {
  originalName: string;
  extension: string;
  sizeBytes: number;
};

export function Dropzone({
  slug,
  archivoInicial,
}: {
  slug: string;
  archivoInicial: ArchivoMeta | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState<ArchivoMeta | null>(archivoInicial);

  function validarYSeleccionar(f: File) {
    setError(null);
    const ext = nombreYExtension(f.name).extension;
    if (ext !== "zip") {
      setError("Solo se permiten archivos .zip (SCORM).");
      return;
    }
    setArchivo(f);
    setGuardado(null);
    setProgreso(0);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setArrastrando(false);
    const f = e.dataTransfer.files?.[0];
    if (f) validarYSeleccionar(f);
  }

  function onSeleccionArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) validarYSeleccionar(f);
  }

  function guardar() {
    if (!archivo) return;
    setSubiendo(true);
    setError(null);
    setProgreso(0);

    // XHR para poder mostrar progreso de subida de archivos grandes.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/upload/${slug}`);
    xhr.setRequestHeader("x-file-name", encodeURIComponent(archivo.name));
    xhr.setRequestHeader("Content-Type", archivo.type || "application/zip");

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setProgreso(Math.round((ev.loaded / ev.total) * 100));
      }
    };

    xhr.onload = () => {
      setSubiendo(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        setGuardado(data.file);
        setArchivo(null);
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          setError(data?.error?.message ?? "No se pudo subir el archivo.");
        } catch {
          setError("No se pudo subir el archivo.");
        }
      }
    };

    xhr.onerror = () => {
      setSubiendo(false);
      setError("Error de red durante la subida.");
    };

    xhr.send(archivo);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Zona de arrastrar y soltar */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-4 rounded-carso border-2 border-dashed p-10 text-center transition ${
          arrastrando
            ? "border-carso-teal bg-carso-bgSoft"
            : "border-gray-300 bg-white"
        }`}
      >
        <p className="text-base font-medium text-carso-text">
          Arrastra y suelta tu archivo aquí
        </p>
        <p className="text-xs text-carso-textSoft">Solo archivos .zip (SCORM)</p>

        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={onSeleccionArchivo}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
        >
          Cargar archivo
        </Button>
      </div>

      {/* Archivo seleccionado (confirmación: nombre + extensión) */}
      {archivo && (
        <div className="flex items-center justify-between rounded-carso border border-gray-200 bg-white px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-carso-text">
              {archivo.name}
            </span>
            <span className="text-xs text-carso-textSoft">
              .{nombreYExtension(archivo.name).extension} ·{" "}
              {formatearTamano(archivo.size)}
            </span>
          </div>
          {!subiendo && (
            <button
              onClick={() => setArchivo(null)}
              className="text-sm text-carso-textSoft hover:text-red-600"
            >
              Quitar
            </button>
          )}
        </div>
      )}

      {/* Barra de progreso */}
      {subiendo && (
        <div className="flex flex-col gap-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-carso-teal transition-all"
              style={{ width: `${progreso}%` }}
            />
          </div>
          <span className="text-xs text-carso-textSoft">
            Subiendo... {progreso}%
          </span>
        </div>
      )}

      {error && (
        <p className="rounded-carso bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Archivo ya guardado en el servidor */}
      {guardado && !archivo && (
        <div className="rounded-carso bg-green-50 px-4 py-3">
          <p className="text-sm font-medium text-green-800">
            Archivo guardado correctamente
          </p>
          <p className="text-xs text-green-700">
            {guardado.originalName} · .{guardado.extension} ·{" "}
            {formatearTamano(guardado.sizeBytes)}
          </p>
        </div>
      )}

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <Button onClick={guardar} disabled={!archivo || subiendo}>
          {subiendo ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
