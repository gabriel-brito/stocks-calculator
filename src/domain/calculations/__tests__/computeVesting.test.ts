import { describe, expect, it } from "vitest";

import { computeVestingFromSchedule } from "../computeVesting";

describe("computeVesting", () => {
  it("returns 50% after 24 months with monthly schedule", () => {
    const result = computeVestingFromSchedule(
      {
        quantityGranted: 100,
        strikePrice: 0,
        grantDate: "2022-01-01",
        vestingSchedule: {
          startDate: "2022-01-01",
          cliffMonths: 12,
          totalMonths: 36,
          frequency: "MONTHLY",
        },
      },
      "2024-01-01",
    );
    expect(result.vestedPercent).toBeCloseTo(13 / 36, 4);
    expect(result.vestedQty).toBe(36);
  });

  it("respects quarterly frequency and cliff", () => {
    const result = computeVestingFromSchedule(
      {
        quantityGranted: 120,
        strikePrice: 0,
        grantDate: "2024-01-01",
        vestingSchedule: {
          startDate: "2024-01-01",
          cliffMonths: 6,
          totalMonths: 12,
          frequency: "QUARTERLY",
        },
      },
      "2024-10-01",
    );
    expect(result.vestedPercent).toBeCloseTo(0.5, 4);
    expect(result.vestedQty).toBe(60);
  });
});
