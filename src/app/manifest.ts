import type { MetadataRoute } from "next";
import { APP_NAME, APP_TAGLINE } from "@/lib/app";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_TAGLINE,
    lang: "it",
    start_url: "/oggi",
    scope: "/",
    display: "standalone",
    background_color: "#f5f6f2",
    theme_color: "#13784a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
