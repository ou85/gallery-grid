import type { Metadata } from "next";
import { ServiceWorker } from "@/components/service-worker";
import { ImageLightbox } from "@/components/image-lightbox";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://gallery-grid-theta.vercel.app"),
  title: "Gallery | Photo Archive",
  description: "A collection of photographs presented in a clean and elegant gallery.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.png" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Gallery",
    title: "Gallery | Photo Archive",
    description: "A collection of photographs presented in a clean and elegant gallery.",
    images: [
      {
        url: "/og-image.jpg",
        secureUrl: "https://gallery-grid-theta.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Gallery | Photo Archive",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gallery | Photo Archive",
    description: "A collection of photographs presented in a clean and elegant gallery.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
        />
      </head>
      <body>
        {children}
        <ImageLightbox />
        <ServiceWorker />
      </body>
    </html>
  );
}
