import type { AgentRuntimeState } from "@aicos/shared-types";
import { cn, relativeTime } from "@/lib/utils";

const STATUS_STYLE: Record<
  AgentRuntimeState["status"],
  { dot: string; label: string; ring: string }
> = {
  active: { dot: "bg-neon-green", label: "text-neon-green", ring: "shadow-neon-green/50" },
  idle: { dot: "bg-ink-faint", label: "text-ink-dim", ring: "shadow-transparent" },
  failed: { dot: "bg-neon-red", label: "text-neon-red", ring: "shadow-neon-red/50" },
};

export function AgentGrid({ agents }: { agents: AgentRuntimeState[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {agents.map((a) => {
        const s = STATUS_STYLE[a.status];
        return (
          <div
            key={a.agent}
            className={cn(
              "glass glass-hover p-4 shadow-glow",
              s.ring,
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize text-ink">
                {a.agent}
              </span>
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  s.dot,
                  a.status === "active" && "animate-pulseGlow",
                )}
              />
            </div>
            <div className={cn("mt-2 text-xs capitalize", s.label)}>
              {a.status}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-ink-faint">
              <span>q: {a.queueDepth}</span>
              <span>{relativeTime(a.lastRunAt)}</span>
            </div>
            {a.lastError && (
              <div className="mt-2 truncate text-[11px] text-neon-red/80" title={a.lastError}>
                {a.lastError}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
