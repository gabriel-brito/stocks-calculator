import { describe, expect, it } from "vitest";

import { computeVesting } from "../computeVesting";

describe("computeVesting", () => {
  it("returns 50% after 24 months", () => {
    const result = computeVesting("2022-01-01", 100, "2024-01-01");
    expect(result.vestedPercent).toBe(0.5);
    expect(result.vestedQty).toBe(50);
  });
});
