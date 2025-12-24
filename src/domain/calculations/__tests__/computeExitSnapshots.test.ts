import { describe, expect, it } from "vitest";

import { computeExitSnapshots } from "../computeExitSnapshots";

describe("computeExitSnapshots", () => {
  it("returns zero payout for out-of-the-money options", () => {
    const snapshot = computeExitSnapshots({
      exitScenario: {
        date: "2024-06-01",
        exitEquityValue: 1000,
      },
      optionGrants: [
        {
          quantityGranted: 100,
          strikePrice: 20,
          grantDate: "2022-01-01",
          vestingSchedule: {
            startDate: "2022-01-01",
            cliffMonths: 12,
            totalMonths: 36,
            frequency: "MONTHLY",
          },
        },
      ],
      purchasePlans: [],
      capTableBase: {
        commonOutstanding: 100,
        optionPoolReserved: 0,
        otherDilutiveShares: 0,
      },
      dilutionEvents: [],
      entryValuation: {
        date: "2022-01-01",
        equityValue: 500,
      },
    });

    expect(snapshot.options[0]?.payout).toBe(0);
  });

  it("computes exit value for purchases", () => {
    const snapshot = computeExitSnapshots({
      exitScenario: {
        date: "2024-03-01",
        exitEquityValue: 1000,
      },
      optionGrants: [],
      purchasePlans: [
        {
          startDate: "2024-01-01",
          purchaseDayOfMonth: 1,
          monthlyAmount: 1000,
          purchasePriceMode: "FIXED_SHARE_PRICE",
          purchaseSharePriceFixed: 10,
        },
      ],
      capTableBase: {
        commonOutstanding: 100,
        optionPoolReserved: 0,
        otherDilutiveShares: 0,
      },
      dilutionEvents: [],
      entryValuation: {
        date: "2024-01-01",
        equityValue: 1000,
      },
    });

    const purchaseSnapshot = snapshot.purchases[0];
    expect(purchaseSnapshot).toBeTruthy();
    if (purchaseSnapshot) {
      // 3 purchases of 1000 at price 10 => 300 shares, exit share price 10.
      expect(purchaseSnapshot.exitValue).toBe(3000);
    }
  });

  it("applies acceleration on exit", () => {
    const snapshot = computeExitSnapshots({
      exitScenario: {
        date: "2024-06-01",
        exitEquityValue: 10_000,
      },
      optionGrants: [
        {
          quantityGranted: 100,
          strikePrice: 1,
          grantDate: "2024-01-01",
          vestingSchedule: {
            startDate: "2024-01-01",
            cliffMonths: 12,
            totalMonths: 48,
            frequency: "MONTHLY",
          },
          acceleration: {
            type: "SINGLE_TRIGGER",
            percent: 1,
          },
        },
      ],
      purchasePlans: [],
      capTableBase: {
        commonOutstanding: 100,
        optionPoolReserved: 0,
        otherDilutiveShares: 0,
      },
      dilutionEvents: [],
      entryValuation: {
        date: "2024-01-01",
        equityValue: 1000,
      },
    });

    expect(snapshot.options[0]?.exercisableQty).toBe(100);
    expect(snapshot.options[0]?.payout).toBeGreaterThan(0);
  });
});
