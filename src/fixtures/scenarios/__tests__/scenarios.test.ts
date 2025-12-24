import { describe, expect, it } from "vitest";

import { scenarios } from "../index";
import { parseAppState } from "@/domain/schema";

describe("scenario fixtures", () => {
  it("has a healthy scenario count", () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(10);
  });

  it("has unique ids", () => {
    const ids = scenarios.map((scenario) => scenario.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("all scenarios validate against schema", () => {
    scenarios.forEach((scenario) => {
      const parsed = parseAppState(scenario.state);
      if (!parsed.ok) {
        throw new Error(`${scenario.id} invalid: ${parsed.errors.join(", ")}`);
      }
    });
  });
});
