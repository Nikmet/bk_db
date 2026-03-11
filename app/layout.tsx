import type { Metadata } from "next";
import { Rubik, Source_Code_Pro } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "cyrillic"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BK Supply Calculator",
  description: "Внутренняя система расчёта поставок Burger King",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${rubik.variable} ${sourceCodePro.variable} bg-[var(--bk-bg)] text-[var(--bk-text)] antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
