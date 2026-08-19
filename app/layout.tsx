import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "SIMAP — Sistema Municipal de Manutenção Preventiva",
  description: "Gestão, controle e auditoria preventiva da frota pública municipal.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen bg-background text-foreground antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
