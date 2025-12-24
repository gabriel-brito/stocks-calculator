import type {
  AppState,
  ConvertibleInstrument,
  DilutionEvent,
  FinancingRound,
  ShareClass,
} from "../types";
import { compareYMD } from "../date";
import { computeFinancingRounds } from "./computeFinancingRounds";
import { computeConvertibleConversion } from "./computeConvertibleConversion";

const ROUND_EVENT_PREFIX = "Round:";
const ROUND_HOLDER_PREFIX = "Round Investors - ";
const CONVERTIBLE_HOLDER_PREFIX = "Convertible Investors - ";

const sanitizeId = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const resolveRoundClassId = (round: FinancingRound, index: number) => {
  if (round.createsShareClassId) return round.createsShareClassId;
  const slug = sanitizeId(round.seriesName);
  return slug ? `series-${slug}` : `series-${index + 1}`;
};

const resolveRoundHolderId = (round: FinancingRound) =>
  `${ROUND_HOLDER_PREFIX}${round.seriesName}`;

const withoutRoundEvents = (events: DilutionEvent[]) =>
  events.filter((event) => !(event.description ?? "").startsWith(ROUND_EVENT_PREFIX));

const withoutRoundHoldings = (holdings: AppState["holdings"]) =>
  holdings.filter((holding) => !holding.holderId.startsWith(ROUND_HOLDER_PREFIX));

const withoutConvertibleHoldings = (holdings: AppState["holdings"]) =>
  holdings.filter((holding) => !holding.holderId.startsWith(CONVERTIBLE_HOLDER_PREFIX));

const createConvertibleHolderId = (convertible: ConvertibleInstrument) =>
  `${CONVERTIBLE_HOLDER_PREFIX}${convertible.id}`;

export const applyFinancingRounds = (state: AppState): AppState => {
  if (state.financingRounds.length === 0) return state;

  const results = computeFinancingRounds(
    state.financingRounds,
    state.capTableBase,
    state.dilutionEvents,
  );

  const nextDilutionEvents = withoutRoundEvents(state.dilutionEvents);
  const nextHoldings = withoutConvertibleHoldings(withoutRoundHoldings(state.holdings));
  const nextShareClasses = [...state.shareClasses];
  const maxSeniority =
    nextShareClasses.reduce((max, item) => Math.max(max, item.seniority), 0) || 0;
  const convertedIds = new Set<string>();

  results.forEach((result, index) => {
    const round = result.round;
    const classId = resolveRoundClassId(round, index);
    const holderId = resolveRoundHolderId(round);

    const existingClass = nextShareClasses.find((item) => item.id === classId);
    if (existingClass) {
      existingClass.investedAmount += round.investmentAmount;
      if (existingClass.type === "PREFERRED" && existingClass.preferenceMultiple <= 0) {
        existingClass.preferenceMultiple = 1;
      }
    } else {
      const newClass: ShareClass = {
        id: classId,
        name: round.seriesName,
        type: "PREFERRED",
        seniority: maxSeniority + index + 1,
        preferenceMultiple: 1,
        investedAmount: round.investmentAmount,
        participation: "NONE",
      };
      nextShareClasses.push(newClass);
    }

    const existingHolding = nextHoldings.find(
      (holding) => holding.classId === classId && holding.holderId === holderId,
    );
    if (existingHolding) {
      existingHolding.shares += result.newShares;
    } else {
      nextHoldings.push({
        holderId,
        classId,
        shares: result.newShares,
      });
    }

    if (result.newShares > 0) {
      nextDilutionEvents.push({
        date: round.date,
        sharesIssued: result.newShares,
        description: `${ROUND_EVENT_PREFIX} ${round.seriesName} new shares`,
      });
    }

    if (result.poolIncrease > 0) {
      nextDilutionEvents.push({
        date: round.date,
        sharesIssued: result.poolIncrease,
        description: `${ROUND_EVENT_PREFIX} ${round.seriesName} pool top-up`,
      });
    }

    const roundEligibleConvertibles = state.convertibles
      .filter(
        (convertible) =>
          !convertedIds.has(convertible.id) &&
          (convertible.convertsOn === "NEXT_EQUITY_ROUND" ||
            convertible.convertsOn === "BOTH") &&
          compareYMD(convertible.dateIssued, round.date) <= 0,
      )
      .sort((a, b) => compareYMD(a.dateIssued, b.dateIssued));

    roundEligibleConvertibles.forEach((convertible) => {
      const conversion = computeConvertibleConversion(
        convertible,
        result.pricePerShare,
        result.preRoundFD,
        round.date,
      );
      if (!conversion) {
        return;
      }

      const convHolderId = createConvertibleHolderId(convertible);
      const existingConvHolding = nextHoldings.find(
        (holding) => holding.classId === classId && holding.holderId === convHolderId,
      );
      if (existingConvHolding) {
        existingConvHolding.shares += conversion.sharesIssued;
      } else {
        nextHoldings.push({
          holderId: convHolderId,
          classId,
          shares: conversion.sharesIssued,
        });
      }

      nextDilutionEvents.push({
        date: round.date,
        sharesIssued: conversion.sharesIssued,
        description: `${ROUND_EVENT_PREFIX} ${round.seriesName} convertible ${convertible.id}`,
      });

      convertedIds.add(convertible.id);
    });
  });

  return {
    ...state,
    shareClasses: nextShareClasses,
    holdings: nextHoldings,
    dilutionEvents: nextDilutionEvents,
  };
};
