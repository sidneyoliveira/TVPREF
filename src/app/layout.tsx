import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Painel TV - Prefeitura",
  description: "Sistema de exibição da prefeitura",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${rubik.variable} tv-root`}>
      <body className="tv-app-body">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
