import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { UserProvider } from "@/components/UserGate";
import { ToastContainer } from "@/components/Toast";
import { Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "King of the Bar",
  description: "Один тест + мировой рейтинг на Next.js + Supabase",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
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
            <footer className="border-t border-zinc-200 bg-white/95 backdrop-blur-sm py-6 sm:py-8 mt-8 sm:mt-12">
              <div className="max-w-7xl mx-auto px-4 text-xs sm:text-sm text-zinc-600 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-primary-600" />
                  <span className="font-semibold text-zinc-900">King of the Bar</span>
                </div>
                <div>Next.js + Supabase • {new Date().getFullYear()}</div>
              </div>
            </footer>
            <ToastContainer />
          </UserProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
