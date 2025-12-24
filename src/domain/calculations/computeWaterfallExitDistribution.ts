import type { ShareClass, ShareClassType, Holding } from "../types";

export type WaterfallDecision =
  | "PREFERENCE"
  | "CONVERT"
  | "COMMON"
  | "PARTICIPATING";

export type WaterfallClassResult = {
  classId: string;
  name: string;
  type: ShareClassType;
  seniority: number;
  shares: number;
  preferenceAmount: number;
  conversionValue: number;
  decision: WaterfallDecision;
  payout: number;
  rationale: string;
};

export type WaterfallHoldingResult = {
  holderId: string;
  classId: string;
  className: string;
  shares: number;
  payout: number;
};

export type WaterfallExitDistribution = {
  exitEquityValue: number;
  remainingEquity: number;
  classResults: WaterfallClassResult[];
  holdingResults: WaterfallHoldingResult[];
};

const sumSharesByClass = (holdings: Holding[]) =>
  holdings.reduce<Record<string, number>>((acc, holding) => {
    acc[holding.classId] = (acc[holding.classId] ?? 0) + holding.shares;
    return acc;
  }, {});

export const computeWaterfallExitDistribution = (
  shareClasses: ShareClass[],
  holdings: Holding[],
  exitEquityValue: number,
): WaterfallExitDistribution => {
  const classShares = sumSharesByClass(holdings);
  const totalConvertedShares = shareClasses.reduce(
    (sum, shareClass) => sum + (classShares[shareClass.id] ?? 0),
    0,
  );

  const preferredClasses = shareClasses.filter((item) => item.type === "PREFERRED");
  const commonClasses = shareClasses.filter((item) => item.type === "COMMON");

  const preferredDecisions = preferredClasses.map((shareClass) => {
    const shares = classShares[shareClass.id] ?? 0;
    const preferenceAmount = shareClass.investedAmount * shareClass.preferenceMultiple;
    const conversionValue =
      totalConvertedShares > 0 ? (shares / totalConvertedShares) * exitEquityValue : 0;
    const decision: WaterfallDecision =
      shareClass.participation === "FULL"
        ? "PARTICIPATING"
        : conversionValue > preferenceAmount
          ? "CONVERT"
          : "PREFERENCE";
    return {
      shareClass,
      shares,
      preferenceAmount,
      conversionValue,
      decision,
    };
  });

  const classResults: WaterfallClassResult[] = [];
  let remainingEquity = exitEquityValue;

  const orderedPreferred = [...preferredDecisions].sort((a, b) => {
    if (a.shareClass.seniority !== b.shareClass.seniority) {
      return a.shareClass.seniority - b.shareClass.seniority;
    }
    return a.shareClass.name.localeCompare(b.shareClass.name);
  });

  const preferencePayouts = new Map<string, number>();

  orderedPreferred.forEach((entry) => {
    if (entry.decision !== "PREFERENCE" && entry.decision !== "PARTICIPATING") {
      return;
    }
    const payout = Math.min(remainingEquity, entry.preferenceAmount);
    preferencePayouts.set(entry.shareClass.id, payout);
    remainingEquity -= payout;
  });

  const convertingPreferred = preferredDecisions.filter((entry) => entry.decision === "CONVERT");
  const participatingPreferred = preferredDecisions.filter(
    (entry) => entry.decision === "PARTICIPATING",
  );

  type PoolEntry = {
    classId: string;
    shares: number;
    maxAdditional: number;
  };

  const poolEntries: PoolEntry[] = [
    ...commonClasses.map((shareClass) => ({
      classId: shareClass.id,
      shares: classShares[shareClass.id] ?? 0,
      maxAdditional: Number.POSITIVE_INFINITY,
    })),
    ...convertingPreferred.map((entry) => ({
      classId: entry.shareClass.id,
      shares: entry.shares,
      maxAdditional: Number.POSITIVE_INFINITY,
    })),
    ...participatingPreferred.map((entry) => {
      const capMultiple = entry.shareClass.participationCapMultiple;
      const capTotal =
        capMultiple !== undefined
          ? entry.shareClass.investedAmount * capMultiple
          : Number.POSITIVE_INFINITY;
      const preferencePaid = preferencePayouts.get(entry.shareClass.id) ?? 0;
      const maxAdditional = Math.max(0, capTotal - preferencePaid);
      return {
        classId: entry.shareClass.id,
        shares: entry.shares,
        maxAdditional,
      };
    }),
  ].filter((entry) => entry.shares > 0);

  const additionalPayouts = new Map<string, number>();
  let residual = remainingEquity;
  let activeEntries = [...poolEntries];

  while (residual > 0 && activeEntries.length > 0) {
    const totalPoolShares = activeEntries.reduce((sum, entry) => sum + entry.shares, 0);
    if (totalPoolShares <= 0) {
      break;
    }

    const residualStart = residual;
    let capped = false;
    const nextActive: PoolEntry[] = [];
    let payoutTotal = 0;

    activeEntries.forEach((entry) => {
      const proRata = (entry.shares / totalPoolShares) * residualStart;
      const payout = Math.min(proRata, entry.maxAdditional);
      payoutTotal += payout;
      additionalPayouts.set(
        entry.classId,
        (additionalPayouts.get(entry.classId) ?? 0) + payout,
      );

      if (entry.maxAdditional > proRata) {
        nextActive.push({
          ...entry,
          maxAdditional:
            entry.maxAdditional === Number.POSITIVE_INFINITY
              ? Number.POSITIVE_INFINITY
              : Math.max(0, entry.maxAdditional - payout),
        });
      } else if (entry.maxAdditional < proRata) {
        capped = true;
      }
    });

    residual = Math.max(0, residualStart - payoutTotal);

    if (!capped) {
      break;
    }

    activeEntries = nextActive.filter((entry) => entry.maxAdditional > 0);
  }

  shareClasses.forEach((shareClass) => {
    const shares = classShares[shareClass.id] ?? 0;
    if (shareClass.type === "COMMON") {
      const payout = additionalPayouts.get(shareClass.id) ?? 0;
      classResults.push({
        classId: shareClass.id,
        name: shareClass.name,
        type: shareClass.type,
        seniority: shareClass.seniority,
        shares,
        preferenceAmount: 0,
        conversionValue: 0,
        decision: "COMMON",
        payout,
        rationale: "Residual apos preferencias.",
      });
      return;
    }

    const entry = preferredDecisions.find((item) => item.shareClass.id === shareClass.id);
    if (!entry) {
      return;
    }

    if (entry.decision === "PREFERENCE") {
      const payout = preferencePayouts.get(shareClass.id) ?? 0;
      classResults.push({
        classId: shareClass.id,
        name: shareClass.name,
        type: shareClass.type,
        seniority: shareClass.seniority,
        shares,
        preferenceAmount: entry.preferenceAmount,
        conversionValue: entry.conversionValue,
        decision: "PREFERENCE",
        payout,
        rationale:
          payout < entry.preferenceAmount
            ? "Preferencia limitada pelo equity disponivel."
            : "Preferencia 1x vence a conversao.",
      });
      return;
    }
    if (entry.decision === "PARTICIPATING") {
      const preferencePaid = preferencePayouts.get(shareClass.id) ?? 0;
      const additional = additionalPayouts.get(shareClass.id) ?? 0;
      classResults.push({
        classId: shareClass.id,
        name: shareClass.name,
        type: shareClass.type,
        seniority: shareClass.seniority,
        shares,
        preferenceAmount: entry.preferenceAmount,
        conversionValue: entry.conversionValue,
        decision: "PARTICIPATING",
        payout: preferencePaid + additional,
        rationale: "Preferencia + participacao no residual.",
      });
      return;
    }

    const payout = additionalPayouts.get(shareClass.id) ?? 0;
    classResults.push({
      classId: shareClass.id,
      name: shareClass.name,
      type: shareClass.type,
      seniority: shareClass.seniority,
      shares,
      preferenceAmount: entry.preferenceAmount,
      conversionValue: entry.conversionValue,
      decision: "CONVERT",
      payout,
      rationale: "Conversao vence a preferencia.",
    });
  });

  const payoutByClass = classResults.reduce<Record<string, number>>((acc, item) => {
    acc[item.classId] = item.payout;
    return acc;
  }, {});

  const shareCountByClass = classResults.reduce<Record<string, number>>((acc, item) => {
    acc[item.classId] = item.shares;
    return acc;
  }, {});

  const classNameById = shareClasses.reduce<Record<string, string>>((acc, item) => {
    acc[item.id] = item.name;
    return acc;
  }, {});

  const holdingResults: WaterfallHoldingResult[] = holdings.map((holding) => {
    const classShares = shareCountByClass[holding.classId] ?? 0;
    const classPayout = payoutByClass[holding.classId] ?? 0;
    const payoutPerShare = classShares > 0 ? classPayout / classShares : 0;
    return {
      holderId: holding.holderId,
      classId: holding.classId,
      className: classNameById[holding.classId] ?? holding.classId,
      shares: holding.shares,
      payout: holding.shares * payoutPerShare,
    };
  });

  return {
    exitEquityValue,
    remainingEquity: residual,
    classResults,
    holdingResults,
  };
};
