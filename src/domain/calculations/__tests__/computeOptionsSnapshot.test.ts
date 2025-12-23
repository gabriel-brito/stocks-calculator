import { describe, expect, it } from "vitest";

import { computeOptionsSnapshot } from "../computeOptionsSnapshot";

describe("computeOptionsSnapshot", () => {
  it("zeros intrinsic value for expired options", () => {
    const grant = {
      quantityGranted: 100,
      strikePrice: 5,
      grantDate: "2020-01-01",
      expirationDate: "2022-01-01",
      vesting: "25_25_50",
    } as const;

    const snapshot = computeOptionsSnapshot(
      grant,
      { date: "2024-01-01", equityValue: 1000 },
      {
        commonOutstanding: 100,
        optionPoolReserved: 0,
        otherDilutiveShares: 0,
      },
      [],
      "2024-01-01",
    );

    expect(snapshot.expired).toBe(true);
    expect(snapshot.intrinsicValueVested).toBe(0);
  });
});
