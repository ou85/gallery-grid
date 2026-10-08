import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }] },
  experimental: { useTypeScriptCli: false },
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.117.192"],
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/pages/cloud-grid.html", destination: "/cloud-grid", permanent: true },
      { source: "/pages/list.html", destination: "/list", permanent: true },
      { source: "/pages/small-grid.html", destination: "/small-grid", permanent: true },
    ];
  },
};

export default nextConfig;
