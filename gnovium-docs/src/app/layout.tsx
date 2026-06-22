import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import BackToTop from "@/components/BackToTop";
import ThemeProvider from "@/components/ThemeProvider";
import SkipToContent from "@/components/SkipToContent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gnovium API Docs — Knowledge OS",
  description:
    "Complete API reference for Gnovium — a local-first Knowledge Operating System with block-based content, relational knowledge modeling, Git-inspired versioning, and AI-powered semantic retrieval.",
  openGraph: {
    title: "Gnovium API Docs",
    description:
      "Build intelligent knowledge applications with Gnovium's unified graph-driven API.",
    url: "https://api.gnovium.com/docs",
    siteName: "Gnovium",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gnovium API Docs",
    description:
      "Complete API reference for the Gnovium Knowledge Operating System.",
  },
  icons: [
    { rel: "icon", url: "/favicon.ico", sizes: "any" },
    { rel: "icon", url: "/logo/gnovium.jpeg", type: "image/jpeg" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <ThemeProvider>
          <SkipToContent />
          <Navigation />
          {children}
          <BackToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}
