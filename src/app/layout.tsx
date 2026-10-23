import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Capacítate Carso — Portal de carga de archivos",
  description:
    "Portal seguro para la transferencia de paquetes SCORM de Capacítate Carso.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
