import type { Metadata } from "next";
import "./globals.css";
import { getBrandSettings } from "@/lib/brand-settings";

export async function generateMetadata(): Promise<Metadata> {
  const b = await getBrandSettings();
  const name = b.configured && b.orgName ? b.orgName : "Dot One Portal";
  return {
  title: name,
  description: "Your studio's home for the work we make together — book sessions, follow your project from start to finish, and receive your finished work.",
  icons: {
    icon: [ { url: "/favicon.ico?v=2", sizes: "any" }, { url: "/dot1-icon.png?v=2", type: "image/png" } ],
    apple: "/dot1-icon.png?v=2",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Dot One", statusBarStyle: "default" },
  openGraph: { title: name, description: "Book sessions, follow your project, and receive your finished work.", siteName: name },
  }; 
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const b = await getBrandSettings();
  const vars = b.configured
    ? `:root{${b.accent ? `--d1-accent:${b.accent};` : ""}${b.background ? `--d1-cream:${b.background};` : ""}${b.paper ? `--d1-paper:${b.paper};` : ""}${b.ink ? `--d1-ink:${b.ink};` : ""}${b.line ? `--d1-line:${b.line};` : ""}}`
    : "";
  const bg = b.configured && b.background ? b.background : "#fbf8f2";
  const themeColor = b.configured && b.background ? b.background : "#f4f0e7";
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500;6..96,600;6..96,700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <meta name="theme-color" content={themeColor} />
        <meta name="mobile-web-app-capable" content="yes" />
        {vars ? <style dangerouslySetInnerHTML={{ __html: vars }} /> : null}
      </head>
      <body style={{ margin: 0, fontFamily: "Archivo, system-ui, sans-serif", background: bg }}>{children}</body>
    </html>
  );
}
