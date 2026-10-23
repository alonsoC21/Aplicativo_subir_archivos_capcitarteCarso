import { notFound } from "next/navigation";

import { clienteAutorizado } from "@/lib/auth";
import { CarsoHeader } from "@/components/CarsoHeader";
import { buscarPorSlug } from "@/server/link.service";
import { EmpresaFlow } from "./EmpresaFlow";

export default async function UploadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // El enlace debe existir; si fue revocado o no existe -> 404.
  const link = await buscarPorSlug(slug);
  if (!link) notFound();

  const autorizado = await clienteAutorizado(slug);
  const archivoActual = link.file
    ? {
        originalName: link.file.originalName,
        extension: link.file.extension,
        sizeBytes: Number(link.file.sizeBytes),
      }
    : null;

  return (
    <div className="min-h-screen bg-carso-bg">
      <CarsoHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-2 text-2xl font-semibold text-carso-teal">
          Carga de archivo
        </h1>
        <p className="mb-8 text-sm text-carso-textSoft">
          {link.name}
        </p>
        <EmpresaFlow
          slug={slug}
          autorizadoInicial={autorizado}
          archivoInicial={archivoActual}
        />
      </main>
    </div>
  );
}
