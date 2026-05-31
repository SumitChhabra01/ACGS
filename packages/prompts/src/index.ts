// Centralized, versioned prompt templates. Both TS and Python read these keys
// (Python loads the same definitions from prompts.json, generated from here).
// Keep prompts SMALL and reusable; inject only retrieved context, never raw history.

export interface PromptTemplate {
  key: string;
  version: number;
  description: string;
  template: string;
}

function p(t: PromptTemplate): PromptTemplate {
  return t;
}

export const PROMPTS = {
  trend_classify: p({
    key: "trend_classify",
    version: 1,
    description: "Tier-1 local: classify a raw trend item into niche relevance + scores.",
    template: [
      "You classify content trends for the brand niche: {{niche}}.",
      "Given the trend item below, return STRICT JSON with keys:",
      "topic (string), viral_score (0-100), opportunity_score (0-100), reason (short).",
      "Trend item: {{item}}",
    ].join("\n"),
  }),

  strategy_generate: p({
    key: "strategy_generate",
    version: 1,
    description: "Tier-2: turn top trends into a posting strategy for one platform.",
    template: [
      "Brand: {{brandName}} | Niche: {{niche}} | Voice: {{voice}}",
      "Platform: {{platform}}.",
      "Top trends (JSON): {{trends}}",
      "Produce STRICT JSON: { angle, hooks[3], hashtags[8], format }.",
      "Keep it specific, on-brand, and platform-appropriate.",
    ].join("\n"),
  }),

  content_outline: p({
    key: "content_outline",
    version: 1,
    description: "Tier-2: outline before full generation (precision step 1).",
    template: [
      "Create a tight outline for a {{platform}} {{contentType}}.",
      "Strategy: {{strategy}}",
      "Retrieved similar successful posts (for structure reuse): {{rag}}",
      "Return STRICT JSON: { hook, beats[], cta }.",
    ].join("\n"),
  }),

  content_generate: p({
    key: "content_generate",
    version: 1,
    description: "Tier-2/3: generate final content from an approved outline.",
    template: [
      "Brand voice: {{voice}}. Platform: {{platform}}. Type: {{contentType}}.",
      "Outline: {{outline}}",
      "Constraints: {{constraints}}",
      "Write the final {{contentType}}. Output ONLY the content text.",
    ].join("\n"),
  }),

  content_optimize: p({
    key: "content_optimize",
    version: 1,
    description: "Tier-3 (gated): viral optimization pass on high-opportunity content.",
    template: [
      "Improve the hook strength and shareability of this {{platform}} content",
      "WITHOUT changing its factual claims or going off-brand.",
      "Content: {{content}}",
      "Return ONLY the improved content text.",
    ].join("\n"),
  }),

  command_parse: p({
    key: "command_parse",
    version: 1,
    description: "Tier-1/2: parse an admin natural-language command into an intent.",
    template: [
      "Parse the admin command into STRICT JSON intent.",
      "Allowed actions: generate_content, analyze_trends, publish_top, pause_publishing,",
      "show_analytics, activate_agents, set_budget.",
      "Command: {{command}}",
      'Return: { action, params } where params is an object.',
    ].join("\n"),
  }),
} as const;

export type PromptKey = keyof typeof PROMPTS;

export function render(
  key: PromptKey,
  vars: Record<string, string>,
): string {
  let out = PROMPTS[key].template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
}
