import { redirect } from "next/navigation";

import { obtenerSesionAdmin } from "@/lib/auth";
import { CarsoHeader } from "@/components/CarsoHeader";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage() {
  // Si ya hay sesión, ir directo al panel.
  if (await obtenerSesionAdmin()) redirect("/admin");

  return (
    <div className="min-h-screen bg-carso-bg">
      <CarsoHeader />
      <main className="mx-auto flex max-w-md flex-col px-6 py-16">
        <h1 className="mb-6 text-center text-2xl font-semibold text-carso-teal">
          Acceso de administrador
        </h1>
        <LoginForm />
      </main>
    </div>
  );
}
