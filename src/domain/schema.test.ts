import { describe, expect, it } from "vitest";

import { parseAppState } from "./schema";

const validState = {
  schemaVersion: "v2",
  capTableBase: {
    commonOutstanding: 100,
    optionPoolReserved: 20,
    otherDilutiveShares: 0,
  },
  dilutionEvents: [],
  valuations: {
    entry: {
      date: "2024-01-01",
      equityValue: 1_000_000,
    },
    current: {
      date: "2024-12-31",
      equityValue: 2_000_000,
    },
  },
  optionGrants: [
    {
      quantityGranted: 100,
      strikePrice: 10,
      grantDate: "2024-01-15",
      vestingSchedule: {
        startDate: "2024-01-15",
        cliffMonths: 12,
        totalMonths: 36,
        frequency: "MONTHLY",
      },
    },
  ],
  purchasePlans: [
    {
      startDate: "2024-02-01",
      purchaseDayOfMonth: 10,
      monthlyAmount: 500,
      purchasePriceMode: "FIXED_SHARE_PRICE",
      purchaseSharePriceFixed: 5,
    },
  ],
  shareClasses: [
    {
      id: "common",
      name: "Common",
      type: "COMMON",
      seniority: 0,
      preferenceMultiple: 0,
      investedAmount: 0,
      participation: "NONE",
    },
  ],
  holdings: [
    {
      holderId: "You",
      classId: "common",
      shares: 100,
    },
  ],
  financingRounds: [],
  convertibles: [],
  settings: {
    persistenceOptIn: true,
    currency: "BRL",
  },
};

describe("parseAppState", () => {
  it("returns ok for a valid state", () => {
    const result = parseAppState(validState);
    expect(result.ok).toBe(true);
  });

  it("returns errors for invalid purchase plan", () => {
    const result = parseAppState({
      ...validState,
      purchasePlans: [
        {
          startDate: "2024-02-01",
          purchaseDayOfMonth: 31,
          monthlyAmount: 500,
          purchasePriceMode: "FIXED_SHARE_PRICE",
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(" ")).toMatch(/purchaseDayOfMonth/);
    }
  });

  it("rejects invalid dates", () => {
    const result = parseAppState({
      ...validState,
      valuations: {
        ...validState.valuations,
        entry: {
          ...validState.valuations.entry,
          date: "2025-02-30",
        },
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(" ")).toMatch(/date/);
    }
  });
});
