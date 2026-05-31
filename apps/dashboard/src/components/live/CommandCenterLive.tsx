"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Panel, StatPill } from "@/components/ui/Panel";
import { AgentGrid } from "@/components/widgets/AgentGrid";
import { BudgetWidget } from "@/components/widgets/BudgetWidget";
import { BurnChart } from "@/components/widgets/BurnChart";
import { TrendList } from "@/components/widgets/TrendList";
import { CommandConsole } from "@/components/CommandConsole";
import {
  fetchAgents,
  fetchBurnSeries,
  fetchTrends,
  fetchUsageSummary,
} from "@/lib/live-client";
import type { AgentRuntimeState, Trend } from "@aicos/shared-types";
import type { BurnPoint, UsageSummary } from "@/lib/queries";
import { formatCompact, formatUsd } from "@/lib/utils";

export function CommandCenterLive() {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentRuntimeState[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [burn, setBurn] = useState<BurnPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [a, t, u, b] = await Promise.all([
        fetchAgents(),
        fetchTrends(),
        fetchUsageSummary(),
        fetchBurnSeries(),
      ]);
      if (cancelled) return;
      setAgents(a);
      setTrends(t);
      setUsage(u);
      setBurn(b);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeAgents = agents.filter((x) => x.status === "active").length;
  const queueTotal = agents.reduce((s, x) => s + x.queueDepth, 0);

  if (loading) {
    return (
      <div>
        <TopBar title="Command Center" subtitle="Loading live data from Supabase…" />
        <p className="text-sm text-ink-dim">Fetching trends, spend, and agent runs.</p>
      </div>
    );
  }

  if (!usage) {
    return (
      <div>
        <TopBar title="Command Center" subtitle="Waiting for data" />
        <Panel title="No data yet">
          <p className="text-sm text-ink-dim">
            Run a GitHub Actions workflow (Analytics / Trends / Content) or add repository
            secrets, then refresh this page. Data updates automatically — no redeploy needed.
          </p>
        </Panel>
      </div>
    );
  }

  return (
    <div>
      <TopBar
        title="Command Center"
        subtitle="Live from Supabase — refresh after cron runs to see new data"
      />

      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <StatPill label="Active agents" value={`${activeAgents}/${agents.length}`} accent="green" />
        <StatPill label="Queue depth" value={String(queueTotal)} accent="cyan" />
        <StatPill label="Spend today" value={formatUsd(usage.dailySpend)} accent="amber" />
        <StatPill label="Tokens today" value={formatCompact(usage.tokensToday)} accent="violet" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title="AI Command Console" subtitle="View only on public site">
            <CommandConsole />
          </Panel>
          <Panel title="Agents" subtitle="Event-driven — wake on cron only">
            <AgentGrid agents={agents} />
          </Panel>
          <Panel title="AI Spend (14d)" subtitle="From ai_usage table">
            <BurnChart data={burn.length ? burn : [{ day: "—", local: 0, mid: 0, premium: 0 }]} />
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Budget Guard" subtitle="Daily and monthly envelope">
            <BudgetWidget
              dailySpend={usage.dailySpend}
              dailyLimit={usage.dailyLimit}
              monthlySpend={usage.monthlySpend}
              monthlyLimit={usage.monthlyLimit}
              byTier={usage.byTier}
            />
          </Panel>
          <Panel title="Top Trends" subtitle="From trends table">
            {trends.length ? (
              <TrendList trends={trends} />
            ) : (
              <p className="text-sm text-ink-dim">No trends yet — wait for the 6h trend cron.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
