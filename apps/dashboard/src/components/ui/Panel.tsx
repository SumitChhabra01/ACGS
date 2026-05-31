import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  subtitle,
  right,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("glass p-5", className)}>
      {(title || right) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-dim">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-xs text-ink-faint">{subtitle}</p>
            )}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatPill({
  label,
  value,
  accent = "cyan",
}: {
  label: string;
  value: string;
  accent?: "cyan" | "violet" | "green" | "amber" | "red" | "pink";
}) {
  const map: Record<string, string> = {
    cyan: "text-neon-cyan shadow-neon-cyan",
    violet: "text-neon-violet shadow-neon-violet",
    green: "text-neon-green shadow-neon-green",
    amber: "text-neon-amber shadow-neon-amber",
    red: "text-neon-red shadow-neon-red",
    pink: "text-neon-pink shadow-neon-pink",
  };
  return (
    <div className="glass glass-hover p-4">
      <div className="text-xs uppercase tracking-wider text-ink-faint">
        {label}
      </div>
      <div className={cn("mt-1 text-2xl font-semibold neon-text", map[accent])}>
        {value}
      </div>
    </div>
  );
}
