export * from "./model-tiers";
export * from "./budgets";
export * from "./env";

export const APP_NAME = "AICOS";
export const APP_TAGLINE = "AI Autonomous Content Operating System";

export const SCHEDULES = {
  trends: "every 2h",
  content: "every 6h",
  analytics: "daily",
} as const;
