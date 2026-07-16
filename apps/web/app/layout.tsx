import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nuvonode",
  description: "Açık modeller için sade API ve node deneyimi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
