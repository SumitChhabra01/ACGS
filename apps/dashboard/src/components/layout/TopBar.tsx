import { ShieldCheck, Activity } from "lucide-react";
import { isPublicDemo } from "@/lib/site";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const configured =
    !isPublicDemo &&
    Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  return (
    <header className="relative z-20 mb-4 flex flex-col gap-3 border-b border-white/10 bg-bg/60 py-3 backdrop-blur-xl sm:mb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:py-4 lg:sticky lg:top-0">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-ink sm:text-xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 line-clamp-3 text-xs text-ink-dim sm:line-clamp-2 sm:text-sm">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-ink-dim sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
          <Activity className="h-3 w-3 shrink-0 text-neon-cyan sm:h-3.5 sm:w-3.5" />
          {isPublicDemo ? "Live" : configured ? "Live" : "Demo"}
        </span>
        <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink-dim sm:inline-flex">
          <ShieldCheck className="h-3.5 w-3.5 text-neon-green" />
          Single admin
        </span>
      </div>
    </header>
  );
}
