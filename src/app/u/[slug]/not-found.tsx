import { CarsoHeader } from "@/components/CarsoHeader";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-carso-bg">
      <CarsoHeader />
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="mb-3 text-2xl font-semibold text-carso-teal">
          Enlace no disponible
        </h1>
        <p className="text-sm text-carso-textSoft">
          Este enlace no existe o fue revocado. Contacte a su administrador de
          Capacítate Carso.
        </p>
      </main>
    </div>
  );
}
