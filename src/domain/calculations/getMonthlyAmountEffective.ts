import { compareYMD } from "../date";
import type { ContributionChange, PurchasePlan } from "../types";

const getOrderedChanges = (changes: ContributionChange[]) =>
  [...changes].sort((a, b) => compareYMD(a.effectiveDate, b.effectiveDate));

export const getMonthlyAmountEffective = (
  plan: PurchasePlan,
  purchaseDate: string,
) => {
  let amount = plan.monthlyAmount;
  const changes = plan.contributionChanges ?? [];
  if (changes.length === 0) {
    return amount;
  }

  const ordered = getOrderedChanges(changes);
  for (const change of ordered) {
    if (compareYMD(change.effectiveDate, purchaseDate) <= 0) {
      amount = change.monthlyAmount;
    } else {
      break;
    }
  }

  return amount;
};
