import type { ExitScenario } from "./types";

export const getExitEquityValue = (exitScenario: ExitScenario) => {
  if (exitScenario.enterpriseValue !== undefined) {
    const netDebt = exitScenario.netDebt ?? 0;
    const fees = exitScenario.fees ?? 0;
    return Math.max(0, exitScenario.enterpriseValue - netDebt - fees);
  }

  return exitScenario.exitEquityValue ?? 0;
};
