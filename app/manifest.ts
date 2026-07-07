import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";

// Web app manifest, served at /manifest.webmanifest. The tool list in the
// description is derived from the manifest so it can never fall out of sync.
export default function manifest(): MetadataRoute.Manifest {
  const toolList = TOOLS.map((t) => t.title.replace(/ &.*/, "")).join(", ");
  return {
    name: "CODERCOPS Tools",
    short_name: "CC Tools",
    description: `Free, privacy-first developer utilities: ${toolList}. Runs entirely in your browser.`,
    start_url: "/",
    display: "standalone",
    background_color: "#0A0B0F",
    theme_color: "#0A0B0F",
    orientation: "any",
    icons: [
      { src: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-maskable.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
