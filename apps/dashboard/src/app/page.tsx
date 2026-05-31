import { TopBar } from "@/components/layout/TopBar";
import { Panel, StatPill } from "@/components/ui/Panel";
import { AgentGrid } from "@/components/widgets/AgentGrid";
import { BudgetWidget } from "@/components/widgets/BudgetWidget";
import { BurnChart } from "@/components/widgets/BurnChart";
import { TrendList } from "@/components/widgets/TrendList";
import { CommandConsole } from "@/components/CommandConsole";
import {
  getAgents,
  getBurnSeries,
  getDataMode,
  getTrends,
  getUsageSummary,
} from "@/lib/queries";
import { formatCompact, formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CommandCenter() {
  const [agents, trends, usage, burn, mode] = await Promise.all([
    getAgents(),
    getTrends(),
    getUsageSummary(),
    getBurnSeries(),
    getDataMode(),
  ]);
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const queueTotal = agents.reduce((s, a) => s + a.queueDepth, 0);

  return (
    <div>
      <TopBar
        title="Command Center"
        subtitle={
          mode.live
            ? "Mission control — live data"
            : "Mission control — demo data (connect Supabase for live)"
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatPill label="Active agents" value={`${activeAgents}/${agents.length}`} accent="green" />
        <StatPill label="Queue depth" value={String(queueTotal)} accent="cyan" />
        <StatPill label="Spend today" value={formatUsd(usage.dailySpend)} accent="amber" />
        <StatPill label="Tokens today" value={formatCompact(usage.tokensToday)} accent="violet" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title="AI Command Console" subtitle="Natural language — text or voice">
            <CommandConsole />
          </Panel>

          <Panel title="Agents" subtitle="Event-driven — wake on cron / command only">
            <AgentGrid agents={agents} />
          </Panel>

          <Panel title="AI Spend (14d)" subtitle="Cheap-first routing keeps premium calls rare">
            <BurnChart data={burn} />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Budget Guard" subtitle="Daily & monthly envelope">
            <BudgetWidget
              dailySpend={usage.dailySpend}
              dailyLimit={usage.dailyLimit}
              monthlySpend={usage.monthlySpend}
              monthlyLimit={usage.monthlyLimit}
              byTier={usage.byTier}
            />
          </Panel>

          <Panel title="Top Trends" subtitle="Scored by the trend agent">
            <TrendList trends={trends} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
