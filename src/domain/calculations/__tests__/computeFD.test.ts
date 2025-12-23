import { describe, expect, it } from "vitest";

import type { DilutionEvent } from "@/domain/types";

import { computeFD } from "../computeFD";

describe("computeFD", () => {
  it("sums base and eligible dilution events", () => {
    const base = {
      commonOutstanding: 100,
      optionPoolReserved: 20,
      otherDilutiveShares: 10,
    };
    const events: DilutionEvent[] = [
      { date: "2024-01-15", sharesIssued: 50 },
      { date: "2024-03-01", sharesIssued: 25 },
    ];

    expect(computeFD(base, events, "2024-02-01")).toBe(180);
  });
});
