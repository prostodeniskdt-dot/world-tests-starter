import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { UserProvider } from "@/components/UserGate";
import { Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "King of the Bar",
  description: "Один тест + мировой рейтинг на Next.js + Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <ErrorBoundary>
          <UserProvider>
            <Nav />
            <main className="min-h-screen bg-zinc-50">{children}</main>
            <footer className="border-t border-zinc-200 bg-white/95 backdrop-blur-sm py-8 mt-12">
              <div className="max-w-7xl mx-auto px-4 text-sm text-zinc-600 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-primary-600" />
                  <span className="font-semibold text-zinc-900">King of the Bar</span>
                </div>
                <div>Next.js + Supabase • {new Date().getFullYear()}</div>
              </div>
            </footer>
          </UserProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
