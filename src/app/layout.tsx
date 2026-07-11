import type { Metadata } from "next";
import { Playfair_Display, Nunito_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { viewport } from "./viewport";
import { Nav } from "@/components/Nav";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { UserProvider } from "@/components/UserGate";
import { ToastContainer } from "@/components/Toast";
import { Footer } from "@/components/Footer";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";

const display = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});

const sans = Nunito_Sans({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  adjustFontFallback: false,
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
};

export { viewport };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Перейти к основному содержимому
        </a>
        <ErrorBoundary>
          <UserProvider>
            <Nav />
            <main id="main-content" className="min-h-screen min-w-0">
              {children}
            </main>
            <Footer />
            <ToastContainer />
            <CookieConsentBanner />
          </UserProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
