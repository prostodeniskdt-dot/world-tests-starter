"use client";

import Link from "next/link";
import { UserMenu } from "./UserMenu";

export function Nav() {
  return (
    <header className="border-b bg-white sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-semibold text-lg">
          World Tests
        </Link>
        <div className="flex items-center gap-4">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
