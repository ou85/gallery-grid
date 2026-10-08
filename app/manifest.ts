import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Gallery Grid", short_name: "Gallery", start_url: "/", display: "standalone", background_color: "#000000", theme_color: "#000000", icons: [{ src: "/favicon.png", sizes: "114x114", type: "image/png" }] };
}
