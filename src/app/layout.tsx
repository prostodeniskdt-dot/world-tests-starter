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
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-4xl px-4 pb-10 text-sm text-zinc-500">
          <div className="border-t pt-6">
            Demo starter • Next.js + Supabase • {new Date().getFullYear()}
          </div>
        </footer>
      </body>
    </html>
  );
}
