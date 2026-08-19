"use client";

import { Breadcrumbs } from "./breadcrumbs";
import { ThemeToggle } from "./theme-toggle";
import { UserNav } from "./user-nav";
import { useSidebar } from "./sidebar-context";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function Header() {
  const { toggleMobileSidebar } = useSidebar();

  return (
    <header className="h-16 border-b border-border/40 bg-card/20 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Botão de abrir Menu em Mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileSidebar}
          className="flex md:hidden h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/60"
          title="Abrir Menu"
          aria-label="Abrir menu mobile"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}
