import type { Metadata } from "next";
import { ServiceWorker } from "@/components/service-worker";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gallery Grid",
  description: "A rotating image gallery",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<ServiceWorker /></body></html>;
}
