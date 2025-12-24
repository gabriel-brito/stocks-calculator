import type {
  CapTableBase,
  DilutionEvent,
  ExitScenario,
  OptionGrant,
  PurchasePlan,
  ValuationPoint,
} from "../types";
import { getExitEquityValue } from "../exit";
import { computeFD } from "./computeFD";
import { computeSharePrice } from "./computeSharePrice";
import { computeVestingFromSchedule } from "./computeVesting";
import { generateMonthlyPurchaseDates } from "./generateMonthlyPurchaseDates";
import { getPurchaseSharePrice } from "./getPurchaseSharePrice";
import { getMonthlyAmountEffective } from "./getMonthlyAmountEffective";
import { addDaysYMD, compareYMD } from "../date";

export type ExitOptionSnapshot = {
  grant: OptionGrant;
  vestedQty: number;
  exercisableQty: number;
  intrinsicPerOption: number;
  payout: number;
  expired: boolean;
};

export type ExitPurchaseSnapshot = {
  plan: PurchasePlan;
  sharesTotal: number;
  exitValue: number;
};

export type ExitSnapshots = {
  exitFD: number;
  exitSharePrice: number;
  options: ExitOptionSnapshot[];
  purchases: ExitPurchaseSnapshot[];
};

const computePlanSharesTotal = (
  plan: PurchasePlan,
  entryValuation: ValuationPoint,
  capTableBase: CapTableBase,
  dilutionEvents: DilutionEvent[],
  asOfDate: string,
) => {
  const entryFD = computeFD(capTableBase, dilutionEvents, entryValuation.date);
  const purchaseSharePrice = getPurchaseSharePrice(
    plan,
    entryValuation,
    entryFD,
  );
  const purchaseDates = generateMonthlyPurchaseDates(
    plan.startDate,
    asOfDate,
    plan.purchaseDayOfMonth,
  );
  let sharesTotal = 0;
  for (const date of purchaseDates) {
    const amount = getMonthlyAmountEffective(plan, date);
    if (amount > 0) {
      sharesTotal += amount / purchaseSharePrice;
    }
  }
  return sharesTotal;
};

export const computeExitSnapshots = ({
  exitScenario,
  optionGrants,
  purchasePlans,
  capTableBase,
  dilutionEvents,
  entryValuation,
}: {
  exitScenario: ExitScenario;
  optionGrants: OptionGrant[];
  purchasePlans: PurchasePlan[];
  capTableBase: CapTableBase;
  dilutionEvents: DilutionEvent[];
  entryValuation: ValuationPoint;
}): ExitSnapshots => {
  const exitFD = computeFD(
    capTableBase,
    dilutionEvents,
    exitScenario.date,
  );
  const exitEquityValue = getExitEquityValue(exitScenario);
  const exitSharePrice = computeSharePrice(exitEquityValue, exitFD);

  const options = optionGrants.map((grant) => {
    const vestingAsOf =
      grant.terminationDate && compareYMD(exitScenario.date, grant.terminationDate) > 0
        ? grant.terminationDate
        : exitScenario.date;
    const baseVesting = computeVestingFromSchedule(grant, vestingAsOf);
    const accelerationPercent =
      grant.acceleration && grant.acceleration.type !== "NONE"
        ? Math.min(1, grant.acceleration.percent)
        : 0;
    const vestedPercent = Math.max(baseVesting.vestedPercent, accelerationPercent);
    const vestedQty = Math.floor(grant.quantityGranted * vestedPercent);
    const intrinsicPerOption = Math.max(exitSharePrice - grant.strikePrice, 0);
    const expired =
      grant.expirationDate !== undefined &&
      compareYMD(grant.expirationDate, exitScenario.date) < 0;
    let exercisableQty = expired ? 0 : vestedQty;
    if (
      !expired &&
      grant.terminationDate &&
      compareYMD(exitScenario.date, grant.terminationDate) > 0
    ) {
      const windowDays = grant.postTerminationExerciseWindowDays ?? 0;
      const lastExerciseDate = addDaysYMD(grant.terminationDate, windowDays);
      if (compareYMD(exitScenario.date, lastExerciseDate) > 0) {
        exercisableQty = 0;
      }
    }
    const payout = expired ? 0 : intrinsicPerOption * exercisableQty;

    return {
      grant,
      vestedQty,
      exercisableQty,
      intrinsicPerOption,
      payout,
      expired,
    };
  });

  const purchases = purchasePlans.map((plan) => {
    const sharesTotal = computePlanSharesTotal(
      plan,
      entryValuation,
      capTableBase,
      dilutionEvents,
      exitScenario.date,
    );
    return {
      plan,
      sharesTotal,
      exitValue: sharesTotal * exitSharePrice,
    };
  });

  return {
    exitFD,
    exitSharePrice,
    options,
    purchases,
  };
};
