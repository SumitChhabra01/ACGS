import type {
  AgentRuntimeState,
  AiUsage,
  ContentItem,
  Trend,
} from "@aicos/shared-types";

// Deterministic demo data used while Supabase is not yet configured, so the
// command center renders a realistic state. Replaced by live queries in Phase 2.

export const demoAgents: AgentRuntimeState[] = [
  { agent: "orchestrator", status: "idle", lastRunAt: minsAgo(4), lastError: null, queueDepth: 0 },
  { agent: "trend", status: "active", lastRunAt: minsAgo(12), lastError: null, queueDepth: 3 },
  { agent: "strategy", status: "idle", lastRunAt: minsAgo(70), lastError: null, queueDepth: 0 },
  { agent: "content", status: "active", lastRunAt: minsAgo(2), lastError: null, queueDepth: 5 },
  { agent: "image", status: "idle", lastRunAt: minsAgo(140), lastError: null, queueDepth: 1 },
  { agent: "publishing", status: "idle", lastRunAt: minsAgo(200), lastError: null, queueDepth: 0 },
  { agent: "analytics", status: "idle", lastRunAt: hoursAgo(6), lastError: null, queueDepth: 0 },
  { agent: "learning", status: "failed", lastRunAt: hoursAgo(20), lastError: "Ollama timeout (retrying)", queueDepth: 0 },
];

export const demoTrends: Trend[] = [
  trend("Reddit", "AI agents replacing SaaS dashboards", 88, 92),
  trend("YouTube", "Cinematic AI b-roll workflows", 81, 77),
  trend("Google Trends", "On-device LLMs for privacy", 73, 84),
  trend("X", "Prompt caching cost savings", 69, 71),
  trend("LinkedIn", "Autonomous content ops case studies", 64, 88),
];

export const demoUsage = {
  dailySpend: 4.12,
  dailyLimit: 15,
  monthlySpend: 87.4,
  monthlyLimit: 300,
  tokensToday: 412_000,
  byTier: [
    { tier: "local", calls: 1840, cost: 0 },
    { tier: "mid", calls: 212, cost: 2.9 },
    { tier: "premium", calls: 24, cost: 1.22 },
  ],
};

export const demoBurnSeries = Array.from({ length: 14 }).map((_, i) => ({
  day: `D${i + 1}`,
  local: 0,
  mid: round(1.4 + Math.sin(i / 2) * 0.8 + i * 0.05),
  premium: round(0.6 + Math.cos(i / 3) * 0.4 + i * 0.03),
}));

export const demoContent: ContentItem[] = [
  content("instagram", "instagram_caption", "draft", "5 signs your SaaS dashboard is about to be replaced by an AI agent \u2192"),
  content("youtube", "youtube_short_script", "pending_approval", "HOOK: What if your entire content team was one prompt? Here's how..."),
  content("instagram", "instagram_reel_script", "pending_approval", "Scene 1 (0-2s): Glitchy neon terminal boots up. VO: 'Meet your autonomous content OS.'"),
  content("youtube", "youtube_description", "approved", "In this short we break down how on-device LLMs keep your data private while cutting API costs by 80%."),
  content("instagram", "instagram_caption", "scheduled", "The cheapest AI call is the one you never make. Here's our caching playbook \uD83E\uDDF5"),
  content("youtube", "youtube_short_script", "published", "HOOK: I automated a media company with $100/month. Here's the stack."),
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const demoAnalytics = WEEKDAYS.map((day, i) => ({
  day,
  instagram: round(1200 + Math.sin(i) * 400 + i * 120),
  youtube: round(800 + Math.cos(i) * 300 + i * 90),
}));

export const demoTokenUsage: AiUsage[] = [];

function minsAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString();
}
function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}
function round(n: number): number {
  return Math.round(n * 100) / 100;
}
function trend(source: string, topic: string, viral: number, opp: number): Trend {
  return {
    id: crypto.randomUUID(),
    brandId: "demo",
    source,
    topic,
    viralScore: viral,
    opportunityScore: opp,
    createdAt: minsAgo(15),
  };
}
function content(
  platform: ContentItem["platform"],
  type: ContentItem["type"],
  status: ContentItem["status"],
  body: string,
): ContentItem {
  return {
    id: crypto.randomUUID(),
    brandId: "demo",
    strategyId: null,
    platform,
    type,
    body,
    metadata: {},
    qualityScores: {
      duplicate: 0.04,
      toxicity: 0.01,
      platformOk: true,
      seo: 0.78,
      readability: 0.82,
      engagement: 0.71,
    },
    status,
    createdAt: minsAgo(30),
  };
}
