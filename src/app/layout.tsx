import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "World Tests",
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
        <Nav />
        <main className="min-h-screen bg-zinc-50">{children}</main>
        <footer className="border-t bg-white py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-sm text-zinc-500 text-center">
            World Tests • Next.js + Supabase • {new Date().getFullYear()}
          </div>
        </footer>
      </body>
    </html>
  );
}
