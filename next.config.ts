import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ogni pagina dipende dalla sessione dell'utente: usiamo il rendering
  // dinamico classico invece di Cache Components.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
