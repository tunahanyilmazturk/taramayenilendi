import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "HanTech OSGB Yönetim Sistemi",
  description: "Mobil sağlık taramalarını planlamak, koordine etmek ve yönetmek için HanTech OSGB Yönetim Sistemi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
