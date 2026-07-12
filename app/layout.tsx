import type { Metadata, Viewport } from "next";
import "@fontsource/manrope/300.css";
import "@fontsource/manrope/500.css";
import "@fontsource/montserrat-alternates/300.css";
import "@fontsource/montserrat-alternates/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Меню MY Loft",
  description: "Меню MY Loft на Большой Покровской, 68",
  other: { "codex-preview": "development" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f0f0f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
