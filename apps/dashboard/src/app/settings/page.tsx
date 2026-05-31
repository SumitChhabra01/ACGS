import { TopBar } from "@/components/layout/TopBar";
import { Panel } from "@/components/ui/Panel";
import { CheckCircle2, XCircle } from "lucide-react";

function ConfigRow({ label, ok, hint }: { label: string; ok: boolean; hint: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
      <div>
        <div className="text-sm text-ink">{label}</div>
        <div className="text-[11px] text-ink-faint">{hint}</div>
      </div>
      {ok ? (
        <CheckCircle2 className="h-5 w-5 text-neon-green" />
      ) : (
        <XCircle className="h-5 w-5 text-ink-faint" />
      )}
    </div>
  );
}

export default function SettingsPage() {
  const cfg = {
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    supabase: Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
    redis: Boolean(process.env.UPSTASH_REDIS_REST_URL),
    r2: Boolean(process.env.R2_BUCKET),
  };

  return (
    <div>
      <TopBar title="Settings" subtitle="Brand, budgets, schedules & connections" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Service configuration" subtitle="Set values in .env / Vercel / GitHub secrets">
          <div className="space-y-2">
            <ConfigRow label="Anthropic Claude" ok={cfg.anthropic} hint="ANTHROPIC_API_KEY — mid/premium generation" />
            <ConfigRow label="Supabase (Postgres + pgvector)" ok={cfg.supabase} hint="SUPABASE_URL / keys — data + auth + realtime" />
            <ConfigRow label="Upstash Redis" ok={cfg.redis} hint="UPSTASH_REDIS_* — queue + cache" />
            <ConfigRow label="Cloudflare R2" ok={cfg.r2} hint="R2_* — media storage" />
          </div>
        </Panel>

        <Panel title="Brand profile" subtitle="Configurable — supports multiple brands later">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink-faint">Name</dt><dd className="text-ink">— set in DB —</dd></div>
            <div className="flex justify-between"><dt className="text-ink-faint">Niche</dt><dd className="text-ink">— set in DB —</dd></div>
            <div className="flex justify-between"><dt className="text-ink-faint">Platforms</dt><dd className="text-ink">Instagram, YouTube</dd></div>
            <div className="flex justify-between"><dt className="text-ink-faint">Voice</dt><dd className="text-ink">— provide samples —</dd></div>
          </dl>
        </Panel>

        <Panel title="AI budgets" subtitle="Auto-downgrade protects the envelope">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink-faint">Daily limit</dt><dd className="text-ink">$15.00</dd></div>
            <div className="flex justify-between"><dt className="text-ink-faint">Monthly limit</dt><dd className="text-ink">$300.00</dd></div>
            <div className="flex justify-between"><dt className="text-ink-faint">Per-agent / day</dt><dd className="text-ink">$5.00</dd></div>
          </dl>
        </Panel>

        <Panel title="Schedules" subtitle="GitHub Actions cron (event-driven)">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink-faint">Trends + ideation</dt><dd className="text-ink">every 2h</dd></div>
            <div className="flex justify-between"><dt className="text-ink-faint">Content drafts</dt><dd className="text-ink">every 6h</dd></div>
            <div className="flex justify-between"><dt className="text-ink-faint">Analytics + learning</dt><dd className="text-ink">daily</dd></div>
          </dl>
        </Panel>
      </div>
    </div>
  );
}
