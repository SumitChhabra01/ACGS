import type { Trend } from "@aicos/shared-types";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

function scoreColor(n: number): string {
  if (n >= 85) return "text-neon-green";
  if (n >= 70) return "text-neon-cyan";
  return "text-ink-dim";
}

export function TrendList({ trends }: { trends: Trend[] }) {
  return (
    <ul className="space-y-2">
      {trends.map((t) => (
        <li
          key={t.id}
          className="glass-hover flex items-center gap-3 rounded-xl border border-white/5 p-3"
        >
          <TrendingUp className="h-4 w-4 shrink-0 text-neon-cyan" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-ink">{t.topic}</div>
            <div className="text-[11px] uppercase tracking-wider text-ink-faint">
              {t.source}
            </div>
          </div>
          <div className="flex shrink-0 gap-4 text-right">
            <div>
              <div className={cn("text-sm font-semibold", scoreColor(t.viralScore))}>
                {t.viralScore}
              </div>
              <div className="text-[10px] text-ink-faint">viral</div>
            </div>
            <div>
              <div className={cn("text-sm font-semibold", scoreColor(t.opportunityScore))}>
                {t.opportunityScore}
              </div>
              <div className="text-[10px] text-ink-faint">opp</div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
