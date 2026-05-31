import { NextResponse } from "next/server";
import { z } from "zod";

// Admin command intake. In Phase 1 this performs lightweight rule-based intent
// parsing and (when Redis is configured) enqueues a job. Heavy execution happens
// in the Python agent layer via a queue consumer / GitHub Action workflow_dispatch.

const bodySchema = z.object({
  raw: z.string().min(1).max(500),
  source: z.enum(["text", "voice"]),
});

type Intent = { action: string; params: Record<string, unknown> };

function parseIntent(raw: string): Intent {
  const t = raw.toLowerCase();
  const numMatch = t.match(/\b(\d{1,3})\b/);
  const count = numMatch ? Number(numMatch[1]) : undefined;
  const platform = t.includes("youtube")
    ? "youtube"
    : t.includes("instagram") || t.includes("reel") || t.includes("ig")
      ? "instagram"
      : undefined;

  if (t.includes("analyz") && t.includes("trend"))
    return { action: "analyze_trends", params: { platform } };
  if (t.includes("generate") || t.includes("write") || t.includes("create"))
    return { action: "generate_content", params: { count, platform } };
  if (t.includes("publish") && (t.includes("pause") || t.includes("stop")))
    return { action: "pause_publishing", params: {} };
  if (t.includes("publish"))
    return { action: "publish_top", params: { count, platform } };
  if (t.includes("analytic") || t.includes("dashboard"))
    return { action: "show_analytics", params: {} };
  if (t.includes("activate") && t.includes("agent"))
    return { action: "activate_agents", params: {} };
  if (t.includes("budget"))
    return { action: "set_budget", params: {} };
  return { action: "unknown", params: {} };
}

function describe(intent: Intent): string {
  switch (intent.action) {
    case "generate_content": {
      const c = (intent.params.count as number) ?? "several";
      const p = (intent.params.platform as string) ?? "all platforms";
      return `Queued content generation: ${c} item(s) for ${p}. Drafts will appear in the pipeline for approval.`;
    }
    case "analyze_trends":
      return "Queued trend analysis. Trend agent will wake and report viral/opportunity scores.";
    case "publish_top":
      return "Queued publish-top (human approval still required before posting).";
    case "pause_publishing":
      return "Publishing paused. No content will be posted until resumed.";
    case "show_analytics":
      return "Opening analytics. See the Analytics tab for platform metrics.";
    case "activate_agents":
      return "Agents armed for the next scheduled cycle (still event-driven, not always-on).";
    case "set_budget":
      return "Open Settings to adjust daily/monthly AI budgets.";
    default:
      return "Command received but not understood. Try: 'Generate 5 Instagram captions on AI agents'.";
  }
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid command" }, { status: 422 });
  }

  const intent = parseIntent(parsed.data.raw);
  const queued = Boolean(process.env.UPSTASH_REDIS_REST_URL);

  // TODO(Phase 2): persist command to `commands` table + enqueue to Upstash.
  return NextResponse.json({
    intent,
    queued,
    reply: describe(intent) + (queued ? "" : "  (demo mode: not actually enqueued)"),
  });
}
