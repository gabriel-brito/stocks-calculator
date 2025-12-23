import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Equity Console - Gestao de Participacoes",
  description:
    "Console de simulacao de Cap Table, Valuations, Stock Options e Compras Recorrentes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${geist.className} ${geistMono.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
