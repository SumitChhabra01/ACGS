import { formatUsd } from "@/lib/utils";
import { cn } from "@/lib/utils";

function Bar({ spent, limit }: { spent: number; limit: number }) {
  const pct = Math.min(100, Math.round((spent / limit) * 100));
  const tone =
    pct >= 95 ? "bg-neon-red" : pct >= 85 ? "bg-neon-amber" : "bg-neon-cyan";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-ink-dim">
          {formatUsd(spent)}{" "}
          <span className="text-ink-faint">/ {formatUsd(limit)}</span>
        </span>
        <span
          className={cn(
            pct >= 95 ? "text-neon-red" : pct >= 85 ? "text-neon-amber" : "text-ink-dim",
          )}
        >
          {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function BudgetWidget({
  dailySpend,
  dailyLimit,
  monthlySpend,
  monthlyLimit,
  byTier,
}: {
  dailySpend: number;
  dailyLimit: number;
  monthlySpend: number;
  monthlyLimit: number;
  byTier: { tier: string; calls: number; cost: number }[];
}) {
  return (
    <div className="space-y-4">
      <Bar spent={dailySpend} limit={dailyLimit} />
      <Bar spent={monthlySpend} limit={monthlyLimit} />
      <div className="grid grid-cols-3 gap-2 pt-1">
        {byTier.map((t) => (
          <div key={t.tier} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-ink-faint">
              {t.tier}
            </div>
            <div className="mt-1 text-sm font-semibold text-ink">{t.calls}</div>
            <div className="text-[11px] text-ink-dim">{formatUsd(t.cost)}</div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-ink-faint">
        Auto-downgrade at 85% &middot; pause low-priority at 95%.
      </p>
    </div>
  );
}
