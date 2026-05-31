"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isNavActive, MAIN_NAV } from "@/lib/nav";

/** Bottom tab bar for phones/tablets (sidebar is desktop-only). */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-bg-soft/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      aria-label="Main navigation"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {MAIN_NAV.map(({ href, shortLabel, icon: Icon }) => {
          const active = isNavActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-neon-cyan" : "text-ink-faint active:text-ink-dim",
                )}
              >
                <Icon
                  className={cn("h-5 w-5", active && "drop-shadow-[0_0_8px_rgba(52,231,255,0.6)]")}
                  strokeWidth={active ? 2.25 : 1.75}
                />
                <span className="max-w-[4.5rem] truncate">{shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
