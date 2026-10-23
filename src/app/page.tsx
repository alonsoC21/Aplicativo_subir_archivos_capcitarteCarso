import { redirect } from "next/navigation";

// La raíz redirige al panel de administración.
export default function Home() {
  redirect("/admin");
}
