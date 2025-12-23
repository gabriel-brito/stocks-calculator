import type {
  CapTableBase,
  DilutionEvent,
  ExitScenario,
  OptionGrant,
  PurchasePlan,
  ValuationPoint,
} from "../types";
import { computeFD } from "./computeFD";
import { computeSharePrice } from "./computeSharePrice";
import { computeVesting } from "./computeVesting";
import { generateMonthlyPurchaseDates } from "./generateMonthlyPurchaseDates";
import { getPurchaseSharePrice } from "./getPurchaseSharePrice";
import { getMonthlyAmountEffective } from "./getMonthlyAmountEffective";
import { compareYMD } from "../date";

export type ExitOptionSnapshot = {
  grant: OptionGrant;
  vestedQty: number;
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
  const exitSharePrice = computeSharePrice(
    exitScenario.exitEquityValue,
    exitFD,
  );

  const options = optionGrants.map((grant) => {
    const { vestedQty } = computeVesting(
      grant.grantDate,
      grant.quantityGranted,
      exitScenario.date,
    );
    const intrinsicPerOption = Math.max(exitSharePrice - grant.strikePrice, 0);
    const expired =
      grant.expirationDate !== undefined &&
      compareYMD(grant.expirationDate, exitScenario.date) < 0;
    const payout = expired ? 0 : intrinsicPerOption * vestedQty;

    return {
      grant,
      vestedQty,
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
