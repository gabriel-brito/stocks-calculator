import type { CapTableBase, DilutionEvent, FinancingRound } from "../types";
import { compareYMD } from "../date";
import { computeFD } from "./computeFD";

export type FinancingRoundResult = {
  round: FinancingRound;
  preRoundFD: number;
  pricePerShare: number;
  newShares: number;
  poolIncrease: number;
  postRoundFD: number;
  postOptionPoolReserved: number;
};

export const computeFinancingRounds = (
  rounds: FinancingRound[],
  capTableBase: CapTableBase,
  dilutionEvents: DilutionEvent[],
): FinancingRoundResult[] => {
  if (rounds.length === 0) return [];

  const ordered = [...rounds].sort((a, b) => compareYMD(a.date, b.date));
  let currentFD = computeFD(capTableBase, dilutionEvents, ordered[0].date);
  let currentPool = capTableBase.optionPoolReserved;

  return ordered.map((round) => {
    const preRoundFD = currentFD;
    const pricePerShare =
      round.preMoney > 0 && preRoundFD > 0 ? round.preMoney / preRoundFD : 0;
    const newShares =
      pricePerShare > 0 ? round.investmentAmount / pricePerShare : 0;

    let poolIncrease = 0;
    if (round.targetOptionPoolPostPercent !== undefined) {
      const target = round.targetOptionPoolPostPercent;
      const numerator = target * (preRoundFD + newShares) - currentPool;
      const denominator = 1 - target;
      poolIncrease =
        denominator > 0 ? Math.max(0, numerator / denominator) : 0;
    }

    const postRoundFD = preRoundFD + newShares + poolIncrease;
    currentFD = postRoundFD;
    currentPool = currentPool + poolIncrease;

    return {
      round,
      preRoundFD,
      pricePerShare,
      newShares,
      poolIncrease,
      postRoundFD,
      postOptionPoolReserved: currentPool,
    };
  });
};
