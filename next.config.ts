import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // @react-pdf/renderer sunucu taraflı çalışmalı, istemci bundle'a dahil edilmemeli
  serverExternalPackages: ['@react-pdf/renderer'],
  experimental: {
    cpus: 2,
    workerThreads: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ['image/webp'],
    minimumCacheTTL: 2592000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Arama motorlarında görünmemesi gereken sayfalar (sepet, ödeme, hesap, giriş vb.): noindex, linkler takip edilir.
  // Başlıkla verilir; bu sayfaların çoğu istemci bileşeni (layout'larına metadata eklenemiyor).
  async headers() {
    const noindexPaths = [
      "/cart",
      "/checkout/:path*",
      "/account/:path*",
      "/orders/:path*",
      "/payment/:path*",
      "/quick-order",
      "/request-quote",
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
    ];
    return [
      // "/x/:path*" kalıbı "/x" sayfasının kendisini de kapsar
      ...noindexPaths.map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      })),
      // Ürün arama sonuçları (/products?search=...): sonsuz sayıda ince içerikli sayfa oluşmasın
      {
        source: "/products",
        has: [{ type: "query" as const, key: "search" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      },
    ];
  },
  async redirects() {
    let customRedirects = [];
    try {
      const redirectsPath = path.join(process.cwd(), 'redirects.json');
      if (fs.existsSync(redirectsPath)) {
        customRedirects = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
      }
    } catch (e) {
      console.warn("Could not load redirects.json", e);
    }

    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'ladamarketi.com',
          },
        ],
        destination: 'https://www.ladamarketi.com/:path*',
        permanent: true,
      },
      {
        source: '/urun/:path*',
        destination: '/products/:path*',
        permanent: true,
      },
      {
        source: '/kategori/:path*',
        destination: '/category/:path*',
        permanent: true,
      },
      ...customRedirects
    ];
  },
};

export default nextConfig;
