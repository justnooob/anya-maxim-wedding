import {PUBLIC_ORIGIN} from "@/content/wedding.mjs";
import {YandexMetrika} from "@/components/YandexMetrika";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@/components/opening-scene.css";
import "./typography.css";
import "@/components/botanical.css";
import "./stationery.css";
import "./editorial.css";
import "./chapters.css";
import "./questions.css";
import "./polish.css";
import "./family.css";
import "./english-signatures.css";
import "./lookbook.css";
import "./qa-hardening.css";
import "./countdown.css";
import "./scroll-motion.css";
import "./mobile-browser-fixes.css";
import "./invitation-finishing.css";
import "./site-content-polish.css";
import "@/components/menu-cards.css";
export const viewport: Viewport = {width:'device-width',initialScale:1,viewportFit:'cover'};
export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_ORIGIN),
  openGraph: {title:"Аня & Максим. Приглашение на свадьбу",description:"17 июля 2027. Один особенный день вместе с вами.",url:PUBLIC_ORIGIN,type:"website",locale:"ru_RU",images:[{url:"/images/wedding-og.jpg",width:1200,height:630,alt:"Аня & Максим, 17.07.2027"}]},
  twitter:{card:"summary_large_image",title:"Аня & Максим",description:"Приглашение на свадьбу. 17 июля 2027",images:["/images/wedding-og.jpg"]},
  title: "Аня & Максим, 17 июля 2027",
  description: "Личное приглашение. Один особенный день, и ты, его часть.",
  robots: { index: false, follow: false },
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="ru"><body>{children}<YandexMetrika /></body></html>;
}
