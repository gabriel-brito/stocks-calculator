import { describe, expect, it } from "vitest";

import type { PurchasePlan } from "@/domain/types";

import { getMonthlyAmountEffective } from "../getMonthlyAmountEffective";

describe("getMonthlyAmountEffective", () => {
  it("returns baseline when no changes", () => {
    const plan: PurchasePlan = {
      startDate: "2025-01-01",
      purchaseDayOfMonth: 1,
      monthlyAmount: 3000,
      purchasePriceMode: "FIXED_SHARE_PRICE",
      purchaseSharePriceFixed: 10,
    };

    expect(getMonthlyAmountEffective(plan, "2025-02-01")).toBe(3000);
  });

  it("picks the last change before the purchase date", () => {
    const plan: PurchasePlan = {
      startDate: "2025-01-01",
      purchaseDayOfMonth: 1,
      monthlyAmount: 3000,
      contributionChanges: [
        { effectiveDate: "2025-02-01", monthlyAmount: 3500 },
        { effectiveDate: "2025-04-01", monthlyAmount: 4000 },
      ],
      purchasePriceMode: "FIXED_SHARE_PRICE",
      purchaseSharePriceFixed: 10,
    };

    expect(getMonthlyAmountEffective(plan, "2025-03-01")).toBe(3500);
    expect(getMonthlyAmountEffective(plan, "2025-04-01")).toBe(4000);
  });

  it("ignores future changes", () => {
    const plan: PurchasePlan = {
      startDate: "2025-01-01",
      purchaseDayOfMonth: 1,
      monthlyAmount: 3000,
      contributionChanges: [{ effectiveDate: "2025-04-01", monthlyAmount: 4000 }],
      purchasePriceMode: "FIXED_SHARE_PRICE",
      purchaseSharePriceFixed: 10,
    };

    expect(getMonthlyAmountEffective(plan, "2025-02-01")).toBe(3000);
  });

  it("supports pauses with zero", () => {
    const plan: PurchasePlan = {
      startDate: "2025-01-01",
      purchaseDayOfMonth: 1,
      monthlyAmount: 3000,
      contributionChanges: [{ effectiveDate: "2025-03-01", monthlyAmount: 0 }],
      purchasePriceMode: "FIXED_SHARE_PRICE",
      purchaseSharePriceFixed: 10,
    };

    expect(getMonthlyAmountEffective(plan, "2025-03-01")).toBe(0);
  });
});
