import { describe, expect, it } from "vitest";

import { scenarios } from "@/fixtures/scenarios";
import { waterfallExpectations } from "@/fixtures/scenarios/waterfall-expected";
import { computeWaterfallExitDistribution } from "../computeWaterfallExitDistribution";
import { getExitEquityValue } from "../../exit";

const getScenario = (id: string) => scenarios.find((scenario) => scenario.id === id);

describe("computeWaterfallExitDistribution", () => {
  waterfallExpectations.forEach((expected) => {
    it(`matches expected payouts for ${expected.id}`, () => {
      const scenario = getScenario(expected.id);
      expect(scenario).toBeTruthy();
      if (!scenario?.state.exitScenario) {
        throw new Error("Scenario missing exitScenario");
      }

      const result = computeWaterfallExitDistribution(
        scenario.state.shareClasses,
        scenario.state.holdings,
        getExitEquityValue(scenario.state.exitScenario),
      );

      const classMap = result.classResults.reduce<Record<string, number>>(
        (acc, item) => {
          acc[item.classId] = item.payout;
          return acc;
        },
        {},
      );

      Object.entries(expected.classPayouts).forEach(([classId, payout]) => {
        expect(classMap[classId]).toBeCloseTo(payout, 2);
      });

      const holderTotals = result.holdingResults.reduce<Record<string, number>>(
        (acc, item) => {
          acc[item.holderId] = (acc[item.holderId] ?? 0) + item.payout;
          return acc;
        },
        {},
      );

      Object.entries(expected.holderPayouts).forEach(([holderId, payout]) => {
        expect(holderTotals[holderId]).toBeCloseTo(payout, 2);
      });
    });
  });
});
