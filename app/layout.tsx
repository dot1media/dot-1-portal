import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dot One Portal",
  description:
    "Your studio's home for the work we make together — book sessions, follow your project from start to finish, and receive your finished work.",
  icons: { icon: "/dot1-icon.png?v=1", apple: "/dot1-icon.png?v=1" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Dot One", statusBarStyle: "default" },
  openGraph: {
    title: "Dot One Portal",
    description: "Book sessions, follow your project, and receive your finished work.",
    siteName: "Dot One Portal",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500;6..96,600;6..96,700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#f4f0e7" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body style={{ margin: 0, fontFamily: "Archivo, system-ui, sans-serif", background: "#fbf8f2" }}>{children}</body>
    </html>
  );
}

