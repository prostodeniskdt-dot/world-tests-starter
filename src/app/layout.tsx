import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { UserProvider } from "@/components/UserGate";
import { ToastContainer } from "@/components/Toast";
import { Footer } from "@/components/Footer";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";

export const metadata: Metadata = {
  title: "King of the Bar",
  description: "Тесты + мировой рейтинг на Next.js + PostgreSQL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Перейти к основному содержимому
        </a>
        <ErrorBoundary>
          <UserProvider>
            <Nav />
            <main id="main-content" className="min-h-screen bg-zinc-50">{children}</main>
            <Footer />
            <ToastContainer />
            <CookieConsentBanner />
          </UserProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
