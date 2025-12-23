import { describe, expect, it } from "vitest";

import type { PurchasePlan } from "@/domain/types";

import { computePurchasePlanSnapshot } from "../computePurchasePlanSnapshot";

describe("computePurchasePlanSnapshot", () => {
  it("computes a ~10x multiple with anchored pricing and constant FD", () => {
    const plan: PurchasePlan = {
      startDate: "2024-01-01",
      purchaseDayOfMonth: 1,
      monthlyAmount: 3000,
      purchasePriceMode: "ENTRY_VALUATION_ANCHORED",
    };

    const snapshot = computePurchasePlanSnapshot(
      plan,
      { date: "2024-01-01", equityValue: 100_000 },
      { date: "2024-12-31", equityValue: 1_000_000 },
      {
        commonOutstanding: 1000,
        optionPoolReserved: 0,
        otherDilutiveShares: 0,
      },
      [],
      "2024-12-31",
    );

    expect(snapshot.numMonthsEvaluated).toBe(12);
    expect(snapshot.numPurchasesExecuted).toBe(12);
    expect(snapshot.multiple).toBeCloseTo(10, 5);
  });

  it("generates monthly dates on day 28 across months", () => {
    const plan: PurchasePlan = {
      startDate: "2025-01-10",
      purchaseDayOfMonth: 28,
      monthlyAmount: 1000,
      purchasePriceMode: "FIXED_SHARE_PRICE",
      purchaseSharePriceFixed: 10,
    };

    const snapshot = computePurchasePlanSnapshot(
      plan,
      { date: "2025-01-01", equityValue: 100_000 },
      { date: "2025-03-28", equityValue: 100_000 },
      {
        commonOutstanding: 1000,
        optionPoolReserved: 0,
        otherDilutiveShares: 0,
      },
      [],
      "2025-03-28",
    );

    expect(snapshot.numMonthsEvaluated).toBe(3);
  });

  it("applies contribution changes over time", () => {
    const plan: PurchasePlan = {
      startDate: "2025-01-10",
      purchaseDayOfMonth: 28,
      monthlyAmount: 3000,
      contributionChanges: [
        { effectiveDate: "2025-04-01", monthlyAmount: 4000 },
      ],
      purchasePriceMode: "FIXED_SHARE_PRICE",
      purchaseSharePriceFixed: 10,
    };

    const snapshot = computePurchasePlanSnapshot(
      plan,
      { date: "2025-01-01", equityValue: 100_000 },
      { date: "2025-06-28", equityValue: 100_000 },
      {
        commonOutstanding: 1000,
        optionPoolReserved: 0,
        otherDilutiveShares: 0,
      },
      [],
      "2025-06-28",
    );

    expect(snapshot.numMonthsEvaluated).toBe(6);
    expect(snapshot.investedTotal).toBe(21_000);
    expect(snapshot.sharesTotal).toBe(2100);
  });

  it("supports pause months with zero contribution", () => {
    const plan: PurchasePlan = {
      startDate: "2025-01-10",
      purchaseDayOfMonth: 28,
      monthlyAmount: 2000,
      contributionChanges: [
        { effectiveDate: "2025-02-28", monthlyAmount: 0 },
        { effectiveDate: "2025-04-28", monthlyAmount: 1000 },
      ],
      purchasePriceMode: "FIXED_SHARE_PRICE",
      purchaseSharePriceFixed: 10,
    };

    const snapshot = computePurchasePlanSnapshot(
      plan,
      { date: "2025-01-01", equityValue: 100_000 },
      { date: "2025-04-28", equityValue: 100_000 },
      {
        commonOutstanding: 1000,
        optionPoolReserved: 0,
        otherDilutiveShares: 0,
      },
      [],
      "2025-04-28",
    );

    expect(snapshot.numMonthsEvaluated).toBe(4);
    expect(snapshot.numPurchasesExecuted).toBe(2);
    expect(snapshot.investedTotal).toBe(3000);
  });
});
