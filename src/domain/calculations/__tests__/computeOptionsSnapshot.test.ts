import { describe, expect, it } from "vitest";

import { computeOptionsSnapshot } from "../computeOptionsSnapshot";

describe("computeOptionsSnapshot", () => {
  it("zeros intrinsic value for expired options", () => {
    const grant = {
      quantityGranted: 100,
      strikePrice: 5,
      grantDate: "2020-01-01",
      expirationDate: "2022-01-01",
      vestingSchedule: {
        startDate: "2020-01-01",
        cliffMonths: 12,
        totalMonths: 36,
        frequency: "MONTHLY",
      },
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

  it("zeros exercisable qty after termination window", () => {
    const grant = {
      quantityGranted: 100,
      strikePrice: 1,
      grantDate: "2020-01-01",
      terminationDate: "2024-01-01",
      postTerminationExerciseWindowDays: 30,
      vestingSchedule: {
        startDate: "2020-01-01",
        cliffMonths: 12,
        totalMonths: 36,
        frequency: "MONTHLY",
      },
    } as const;

    const snapshot = computeOptionsSnapshot(
      grant,
      { date: "2024-04-01", equityValue: 1000 },
      {
        commonOutstanding: 100,
        optionPoolReserved: 0,
        otherDilutiveShares: 0,
      },
      [],
      "2024-04-01",
    );

    expect(snapshot.exercisableQty).toBe(0);
    expect(snapshot.intrinsicValueVested).toBe(0);
  });
});
