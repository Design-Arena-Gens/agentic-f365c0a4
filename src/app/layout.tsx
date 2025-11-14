import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "PSO Serbest Vuruş Simülatörü",
  description:
    "Pro Soccer Online ruhunu taşıyan 3D serbest vuruş deneyimi. Hassas güç, yükseklik ve falso kontrolüyle ağları sars.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.className} antialiased bg-neutral-950`}>
        {children}
      </body>
    </html>
  );
}
