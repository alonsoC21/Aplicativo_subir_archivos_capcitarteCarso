import { redirect } from "next/navigation";

import { obtenerSesionAdmin } from "@/lib/auth";
import { CarsoHeader } from "@/components/CarsoHeader";
import { AdminPanel } from "./AdminPanel";
import { LogoutButton } from "./LogoutButton";

export default async function AdminPage() {
  const sesion = await obtenerSesionAdmin();
  if (!sesion) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-carso-bg">
      <CarsoHeader
        rightSlot={
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300">{sesion.user}</span>
            <LogoutButton />
          </div>
        }
      />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-carso-teal">
          Panel de administración
        </h1>
        <AdminPanel />
      </main>
    </div>
  );
}
