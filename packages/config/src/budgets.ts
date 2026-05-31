// Default budget envelope (USD). Admin can override per scope in the `budgets` table.
// Aligns with the PRD MVP target of ~$100-500/month.
export const DEFAULT_BUDGETS = {
  global: {
    dailyLimit: 15,
    monthlyLimit: 300,
  },
  perAgent: {
    dailyLimit: 5,
    monthlyLimit: 100,
  },
  perPlatform: {
    dailyLimit: 7.5,
    monthlyLimit: 150,
  },
} as const;

// Fraction of a budget at which the auto-downgrade behavior kicks in.
export const DOWNGRADE_THRESHOLDS = {
  softWarn: 0.7,
  downgrade: 0.85,
  pauseLowPriority: 0.95,
  hardStop: 1.0,
} as const;
