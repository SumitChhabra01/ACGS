"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Workflow,
  LineChart,
  Settings,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Command Center", icon: LayoutDashboard },
  { href: "/content", label: "Content Pipeline", icon: Workflow },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-bg-soft/60 px-4 py-6 backdrop-blur-xl lg:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-neon-cyan/30 to-neon-violet/30 shadow-glow shadow-neon-cyan">
          <Bot className="h-5 w-5 text-neon-cyan" />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulseGlow rounded-full bg-neon-green" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-wide text-ink">AICOS</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            Content OS
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                active
                  ? "bg-white/10 text-ink shadow-glow shadow-neon-cyan/40"
                  : "text-ink-dim hover:bg-white/5 hover:text-ink",
              )}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5",
                  active ? "text-neon-cyan" : "text-ink-faint group-hover:text-ink-dim",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="glass mt-4 p-3 text-[11px] text-ink-faint">
        <div className="mb-1 flex items-center gap-2 text-neon-green">
          <span className="h-2 w-2 animate-pulseGlow rounded-full bg-neon-green" />
          Event-driven mode
        </div>
        Agents wake on cron / command only. No always-on loops.
      </div>
    </aside>
  );
}
