import { describe, expect, it } from "vitest";

import { scenarios } from "@/fixtures/scenarios";
import { financingRoundExpectations } from "@/fixtures/scenarios/financing-rounds-expected";
import { computeFinancingRounds } from "../computeFinancingRounds";

const getScenario = (id: string) => scenarios.find((scenario) => scenario.id === id);

describe("computeFinancingRounds", () => {
  financingRoundExpectations.forEach((expected) => {
    it(`matches expected rounds for ${expected.id}`, () => {
      const scenario = getScenario(expected.id);
      expect(scenario).toBeTruthy();
      if (!scenario) return;

      const results = computeFinancingRounds(
        scenario.state.financingRounds,
        scenario.state.capTableBase,
        scenario.state.dilutionEvents,
      );

      expect(results).toHaveLength(expected.rounds.length);
      expected.rounds.forEach((round, index) => {
        const result = results[index];
        expect(result.pricePerShare).toBeCloseTo(round.pricePerShare, 4);
        expect(result.newShares).toBeCloseTo(round.newShares, 4);
        expect(result.poolIncrease).toBeCloseTo(round.poolIncrease, 4);
        expect(result.postRoundFD).toBeCloseTo(round.postRoundFD, 4);
      });
    });
  });
});
