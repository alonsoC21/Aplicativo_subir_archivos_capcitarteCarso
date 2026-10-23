"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function salir() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={salir}
      className="rounded-carso border border-gray-500 px-3 py-1 text-sm text-gray-200 hover:bg-carso-darkSoft"
    >
      Salir
    </button>
  );
}
