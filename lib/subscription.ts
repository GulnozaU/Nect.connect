export type PlanRow = {
  plan?: string | null;
  pro_trial_ends_at?: string | null;
  pro_trial_used?: boolean | null;
};

/** Paid Pro subscription (future: Stripe webhook sets plan = pro). */
export function isProPlan(plan: string | null | undefined): boolean {
  return (plan ?? "").toLowerCase() === "pro";
}

export function activeTrialEndsAt(row: PlanRow): Date | null {
  const raw = row.pro_trial_ends_at;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Pro plan or an active Pro trial window unlocks X connect and X publish. */
export function hasXPlatformAccess(row: PlanRow): boolean {
  if (isProPlan(row.plan)) return true;
  const end = activeTrialEndsAt(row);
  if (!end) return false;
  return end.getTime() > Date.now();
}
