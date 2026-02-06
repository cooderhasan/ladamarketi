import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers/session-provider";

// import { Geist, Geist_Mono } from "next/font/google";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

import { prisma } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const generalSettings = await prisma.siteSettings.findUnique({
    where: { key: "general" },
  });

  // Cast the JSON value to a typed object or any for simpler access
  const general = (generalSettings?.value as any) || {};

  return {
    title: {
      default: general.seoTitle || general.siteName || "B2B E-Ticaret Platformu",
      template: `%s | ${general.siteName || "B2B"}`,
    },
    description: general.seoDescription || "B2B Toptan Satış Platformu",
    keywords: general.seoKeywords?.split(",") || [],
    icons: {
      icon: general.faviconUrl || "/favicon.ico",
      shortcut: general.faviconUrl || "/favicon.ico",
      apple: general.faviconUrl || "/favicon.ico", // Or a specific apple touch icon if available
    },
    openGraph: {
      title: general.seoTitle || general.siteName || "B2B E-Ticaret Platformu",
      description: general.seoDescription || "B2B Toptan Satış Platformu",
      siteName: general.siteName || "B2B",
    },
    alternates: {
      canonical: "./",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        <Providers>
          {children}
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
