"use client";

import { Breadcrumbs } from "./breadcrumbs";
import { ThemeToggle } from "./theme-toggle";
import { UserNav } from "./user-nav";

export function Header() {
  return (
    <header className="h-16 border-b border-border/40 bg-card/20 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}
