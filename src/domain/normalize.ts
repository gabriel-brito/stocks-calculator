import { compareYMD } from "./date";
import type { ContributionChange, PurchasePlan } from "./types";

const normalizeContributionChange = (
  change: ContributionChange,
): ContributionChange => ({
  ...change,
  effectiveDate: change.effectiveDate.trim() as ContributionChange["effectiveDate"],
});

export const normalizePurchasePlan = (plan: PurchasePlan): PurchasePlan => {
  if (!plan.contributionChanges || plan.contributionChanges.length === 0) {
    return {
      ...plan,
      contributionChanges: plan.contributionChanges,
    };
  }

  const normalizedChanges = plan.contributionChanges
    .map(normalizeContributionChange)
    .sort((a, b) => compareYMD(a.effectiveDate, b.effectiveDate));

  return {
    ...plan,
    contributionChanges: normalizedChanges,
  };
};
