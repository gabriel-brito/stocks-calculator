import { describe, expect, it } from "vitest";

import { createDocument, parseDocument, SCHEMA_VERSION } from "./document";
import type { AppState } from "./types";

const validState: AppState = {
  schemaVersion: SCHEMA_VERSION,
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
      shares: 120,
    },
  ],
  financingRounds: [],
  convertibles: [],
  settings: {
    persistenceOptIn: true,
    currency: "BRL",
  },
};

describe("AppDocument", () => {
  it("round-trips through export and import", () => {
    const document = createDocument(validState);
    const serialized = JSON.stringify(document);
    const parsed = parseDocument(serialized);

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value).toEqual(document);
    }
  });

  it("migrates v1 documents to v2", () => {
    const v1Document = {
      schemaVersion: "v1",
      state: {
        capTableBase: validState.capTableBase,
        dilutionEvents: validState.dilutionEvents,
        valuations: validState.valuations,
        exitScenario: validState.exitScenario,
        purchasePlans: validState.purchasePlans,
        settings: validState.settings,
        schemaVersion: "v1",
        optionGrants: [
          {
            quantityGranted: 100,
            strikePrice: 10,
            grantDate: "2024-01-15",
            vesting: "25_25_50",
          },
        ],
      },
    };

    const parsed = parseDocument(v1Document);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.schemaVersion).toBe("v2");
      expect(parsed.value.state.schemaVersion).toBe("v2");
      expect(parsed.value.state.optionGrants[0]?.vestingSchedule).toBeTruthy();
    }
  });
});
