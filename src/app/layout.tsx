import type { Metadata } from "next";
import "./globals.css";
import "@/components/opening-scene.css";
import "./typography.css";
import "@/components/botanical.css";
import "./stationery.css";
import "./editorial.css";
import "./chapters.css";
import "./questions.css";
import "./polish.css";
export const metadata: Metadata = {
  title: "Аня & Максим, 17 июля 2027",
  description: "Личное приглашение. Один особенный день, и ты, его часть.",
  robots: { index: false, follow: false },
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="ru"><body>{children}</body></html>;
}
