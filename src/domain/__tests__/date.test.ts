import { describe, expect, it } from "vitest";

import {
  addMonthsKeepDayClamped,
  compareYMD,
  isValidYMD,
  monthsBetweenFloor,
} from "../date";

describe("date helpers", () => {
  it("validates calendar dates", () => {
    expect(isValidYMD("2025-12-31")).toBe(true);
    expect(isValidYMD("2025-02-30")).toBe(false);
    expect(isValidYMD("2025-13-01")).toBe(false);
    expect(isValidYMD("2025-1-01")).toBe(false);
    expect(isValidYMD("2025-01-1")).toBe(false);
  });

  it("compares YYYY-MM-DD dates without timezone offsets", () => {
    expect(compareYMD("2025-01-01", "2025-01-02")).toBe(-1);
    expect(compareYMD("2025-01-02", "2025-01-01")).toBe(1);
    expect(compareYMD("2025-01-01", "2025-01-01")).toBe(0);
  });

  it("computes monthsBetweenFloor with full-month rule", () => {
    expect(monthsBetweenFloor("2025-01-15", "2026-01-15")).toBe(12);
    expect(monthsBetweenFloor("2025-01-15", "2026-01-14")).toBe(11);
  });

  it("treats Jan 31 -> Feb 28 as zero full months", () => {
    expect(monthsBetweenFloor("2025-01-31", "2025-02-28")).toBe(0);
  });

  it("adds months keeping day-of-month", () => {
    expect(addMonthsKeepDayClamped("2025-01-10", 1, 28)).toBe("2025-02-28");
  });
});
