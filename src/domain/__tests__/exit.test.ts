import { describe, expect, it } from "vitest";

import { getExitEquityValue } from "../exit";

describe("getExitEquityValue", () => {
  it("derives equity value from enterprise value", () => {
    const result = getExitEquityValue({
      date: "2025-01-01",
      enterpriseValue: 20_000_000,
      netDebt: 3_000_000,
      fees: 1_000_000,
    });

    expect(result).toBe(16_000_000);
  });

  it("falls back to exit equity value", () => {
    const result = getExitEquityValue({
      date: "2025-01-01",
      exitEquityValue: 12_000_000,
    });

    expect(result).toBe(12_000_000);
  });
});
