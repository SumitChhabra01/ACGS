"use client";

import Link from "next/link";
import { Bot } from "lucide-react";

/** Compact brand bar on small screens (desktop uses the sidebar). */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-bg/80 px-4 py-3 backdrop-blur-xl lg:hidden">
      <Link href="/" className="flex min-w-0 flex-1 items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-neon-cyan/30 to-neon-violet/30">
          <Bot className="h-4 w-4 text-neon-cyan" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold tracking-wide text-ink">AICOS</div>
          <div className="truncate text-[10px] uppercase tracking-[0.18em] text-ink-faint">
            Content OS
          </div>
        </div>
      </Link>
    </header>
  );
}
