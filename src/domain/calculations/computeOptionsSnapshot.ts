import type {
  CapTableBase,
  DilutionEvent,
  OptionGrant,
  ValuationPoint,
} from "../types";
import { computeFD } from "./computeFD";
import { computeSharePrice } from "./computeSharePrice";
import { computeVestingFromSchedule } from "./computeVesting";
import { addDaysYMD, compareYMD } from "../date";

export type OptionsSnapshot = {
  fdAsOf: number;
  sharePriceAsOf: number;
  fdAtGrant: number;
  equityPercentFDAtGrant: number;
  vestedPercent: number;
  vestedQty: number;
  exercisableQty: number;
  intrinsicPerOption: number;
  intrinsicValueVested: number;
  expired: boolean;
};

const getVestingAsOfDate = (grant: OptionGrant, asOfDate: string) => {
  if (grant.terminationDate && compareYMD(asOfDate, grant.terminationDate) > 0) {
    return grant.terminationDate;
  }
  return asOfDate;
};

const computeExercisableQty = (
  grant: OptionGrant,
  vestedQty: number,
  asOfDate: string,
) => {
  if (
    grant.expirationDate !== undefined &&
    compareYMD(grant.expirationDate, asOfDate) < 0
  ) {
    return 0;
  }

  if (grant.terminationDate && compareYMD(asOfDate, grant.terminationDate) > 0) {
    const windowDays = grant.postTerminationExerciseWindowDays ?? 0;
    const lastExerciseDate = addDaysYMD(grant.terminationDate, windowDays);
    if (compareYMD(asOfDate, lastExerciseDate) > 0) {
      return 0;
    }
  }

  return vestedQty;
};

export const computeOptionsSnapshot = (
  grant: OptionGrant,
  valuationPoint: ValuationPoint,
  capTableBase: CapTableBase,
  dilutionEvents: DilutionEvent[],
  asOfDate: string,
): OptionsSnapshot => {
  const fdAsOf = computeFD(capTableBase, dilutionEvents, asOfDate);
  const sharePriceAsOf = computeSharePrice(valuationPoint.equityValue, fdAsOf);
  const fdAtGrant = computeFD(capTableBase, dilutionEvents, grant.grantDate);
  const equityPercentFDAtGrant =
    fdAtGrant > 0 ? grant.quantityGranted / fdAtGrant : 0;
  const vestingAsOf = getVestingAsOfDate(grant, asOfDate);
  const { vestedPercent, vestedQty } = computeVestingFromSchedule(grant, vestingAsOf);

  const intrinsicPerOption = Math.max(sharePriceAsOf - grant.strikePrice, 0);
  const expired =
    grant.expirationDate !== undefined &&
    compareYMD(grant.expirationDate, asOfDate) < 0;
  const exercisableQty = expired
    ? 0
    : computeExercisableQty(grant, vestedQty, asOfDate);
  const intrinsicValueVested = expired
    ? 0
    : intrinsicPerOption * exercisableQty;

  return {
    fdAsOf,
    sharePriceAsOf,
    fdAtGrant,
    equityPercentFDAtGrant,
    vestedPercent,
    vestedQty,
    exercisableQty,
    intrinsicPerOption,
    intrinsicValueVested,
    expired,
  };
};
