import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Gestor de Contenido · Jorge Serratos",
  description: "Directorio de archivos y contenido digital",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
