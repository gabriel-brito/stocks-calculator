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
      vesting: "25_25_50",
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
});
