import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fija la raíz del proyecto para evitar que Next infiera un lockfile externo.
  outputFileTracingRoot: __dirname,
  // Permite subir cuerpos grandes (hasta 10 GB) en Server Actions si se usaran.
  experimental: {
    serverActions: {
      bodySizeLimit: "10gb",
    },
  },
  // Cabeceras de seguridad básicas.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
