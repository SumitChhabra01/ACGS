import { ShieldCheck, Activity } from "lucide-react";
import { isConfigured } from "@/lib/supabase/server";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const configured = isConfigured();
  return (
    <header className="sticky top-0 z-20 mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-bg/60 px-1 py-4 backdrop-blur-xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-ink-dim">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink-dim">
          <Activity className="h-3.5 w-3.5 text-neon-cyan" />
          {configured ? "Live" : "Demo mode"}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink-dim">
          <ShieldCheck className="h-3.5 w-3.5 text-neon-green" />
          Single admin
        </span>
      </div>
    </header>
  );
}
