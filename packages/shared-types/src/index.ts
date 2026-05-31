// Shared domain types for AICOS. Keep in sync with the Supabase schema
// (infrastructure/supabase/migrations) and the Python agent contracts.

export type ModelTier = "local" | "mid" | "premium";

export type AgentName =
  | "orchestrator"
  | "trend"
  | "strategy"
  | "content"
  | "image"
  | "publishing"
  | "analytics"
  | "learning";

export type AgentStatus = "idle" | "active" | "failed";

export type Platform = "instagram" | "youtube";

export type ContentType =
  | "instagram_caption"
  | "instagram_reel_script"
  | "youtube_short_script"
  | "youtube_description";

export type ContentStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "scheduled"
  | "published"
  | "failed";

export type PublicationStatus =
  | "queued"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";

export type CommandSource = "text" | "voice";

export interface BrandProfile {
  id: string;
  name: string;
  niche: string;
  voice: BrandVoice;
  platforms: Platform[];
  createdAt: string;
}

export interface BrandVoice {
  tone: string;
  personaDescription: string;
  doList: string[];
  dontList: string[];
  samplePosts: string[];
}

export interface Trend {
  id: string;
  brandId: string;
  source: string;
  topic: string;
  viralScore: number;
  opportunityScore: number;
  createdAt: string;
}

export interface Strategy {
  id: string;
  brandId: string;
  trendId: string | null;
  angle: string;
  hooks: string[];
  hashtags: string[];
  targetPlatform: Platform;
  status: "proposed" | "selected" | "used";
  createdAt: string;
}

export interface QualityScores {
  duplicate: number;
  toxicity: number;
  platformOk: boolean;
  seo: number;
  readability: number;
  engagement: number;
}

export interface ContentItem {
  id: string;
  brandId: string;
  strategyId: string | null;
  platform: Platform;
  type: ContentType;
  body: string;
  metadata: Record<string, unknown>;
  qualityScores: QualityScores | null;
  status: ContentStatus;
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  contentItemId: string;
  kind: "image";
  r2Key: string;
  prompt: string;
  style: string | null;
  createdAt: string;
}

export interface Publication {
  id: string;
  contentItemId: string;
  platform: Platform;
  externalId: string | null;
  scheduledFor: string | null;
  publishedAt: string | null;
  status: PublicationStatus;
  error: string | null;
  retries: number;
}

export interface AnalyticsRecord {
  id: string;
  publicationId: string;
  platform: Platform;
  metrics: Record<string, number>;
  fetchedAt: string;
}

export interface AiUsage {
  id: string;
  agent: AgentName;
  workflow: string | null;
  platform: Platform | null;
  modelTier: ModelTier;
  inputTokens: number;
  outputTokens: number;
  costEstimate: number;
  createdAt: string;
}

export type BudgetScope = "global" | "agent" | "platform";

export interface Budget {
  id: string;
  scope: BudgetScope;
  scopeRef: string | null;
  dailyLimit: number;
  monthlyLimit: number;
}

export interface Command {
  id: string;
  source: CommandSource;
  raw: string;
  parsedIntent: Record<string, unknown> | null;
  status: "received" | "queued" | "running" | "done" | "failed";
  createdAt: string;
}

export interface AgentRuntimeState {
  agent: AgentName;
  status: AgentStatus;
  lastRunAt: string | null;
  lastError: string | null;
  queueDepth: number;
}
