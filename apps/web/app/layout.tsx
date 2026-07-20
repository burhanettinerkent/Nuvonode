import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nuvonode",
  description: "Tek API ile onaylı açık modelleri çağır. İstersen daha sonra node çalıştır ve aynı hesapta kredi kullan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
