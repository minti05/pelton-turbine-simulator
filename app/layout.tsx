import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Pelton Turbine Simulator | 流体・発電最適化シミュレータ",
  description:
    "マイクロ水力発電に向けた水車の流体力学・発電性能をリアルタイムに最適化するシミュレータ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body className="antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
