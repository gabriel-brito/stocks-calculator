import { describe, expect, it } from "vitest";

import { computeSharePrice } from "../computeSharePrice";

describe("computeSharePrice", () => {
  it("returns equity per fully diluted share", () => {
    expect(computeSharePrice(1000, 100)).toBe(10);
  });

  it("throws when fd is zero or negative", () => {
    expect(() => computeSharePrice(1000, 0)).toThrow(/FD/);
  });
});
