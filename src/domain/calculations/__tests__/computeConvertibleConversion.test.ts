import { describe, expect, it } from "vitest";

import { scenarios } from "@/fixtures/scenarios";
import { convertibleExpectations } from "@/fixtures/scenarios/convertibles-expected";
import {
  computeConvertibleConversion,
  computeFD,
  computeFinancingRounds,
  computeSharePrice,
} from "@/domain/calculations";
import { getExitEquityValue } from "@/domain/exit";

const getScenario = (id: string) => scenarios.find((scenario) => scenario.id === id);

describe("computeConvertibleConversion", () => {
  convertibleExpectations.forEach((expected) => {
    it(`matches expected conversion for ${expected.id}`, () => {
      const scenario = getScenario(expected.id);
      expect(scenario).toBeTruthy();
      if (!scenario) return;

      const convertible = scenario.state.convertibles[0];
      expect(convertible).toBeTruthy();
      if (!convertible) return;

      let basePrice = 0;
      let preRoundFD = 0;
      let asOfDate = convertible.dateIssued;

      if (scenario.state.financingRounds.length > 0) {
        const results = computeFinancingRounds(
          scenario.state.financingRounds,
          scenario.state.capTableBase,
          scenario.state.dilutionEvents,
        );
        const first = results[0];
        basePrice = first.pricePerShare;
        preRoundFD = first.preRoundFD;
        asOfDate = first.round.date;
      } else if (scenario.state.exitScenario) {
        const exitFD = computeFD(
          scenario.state.capTableBase,
          scenario.state.dilutionEvents,
          scenario.state.exitScenario.date,
        );
        basePrice = computeSharePrice(
          getExitEquityValue(scenario.state.exitScenario),
          exitFD,
        );
        preRoundFD = exitFD;
        asOfDate = scenario.state.exitScenario.date;
      }

      const conversion = computeConvertibleConversion(
        convertible,
        basePrice,
        preRoundFD,
        asOfDate,
      );
      expect(conversion).toBeTruthy();
      if (!conversion) return;

      expect(conversion.conversionPrice).toBeCloseTo(expected.conversionPrice, 3);
      expect(conversion.sharesIssued).toBeCloseTo(expected.sharesIssued, 3);
    });
  });
});
