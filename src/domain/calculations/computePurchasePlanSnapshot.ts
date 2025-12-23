import type {
  CapTableBase,
  DilutionEvent,
  PurchasePlan,
  ValuationPoint,
} from "../types";
import { computeFD } from "./computeFD";
import { computeSharePrice } from "./computeSharePrice";
import { generateMonthlyPurchaseDates } from "./generateMonthlyPurchaseDates";
import { getPurchaseSharePrice } from "./getPurchaseSharePrice";
import { getMonthlyAmountEffective } from "./getMonthlyAmountEffective";

export type PurchasePlanSnapshot = {
  numPurchasesExecuted: number;
  numMonthsEvaluated: number;
  investedTotal: number;
  sharesTotal: number;
  avgCost: number;
  currentSharePrice: number;
  currentValue: number;
  gain: number;
  multiple: number;
};

export const computePurchasePlanSnapshot = (
  plan: PurchasePlan,
  entryValuation: ValuationPoint,
  currentValuation: ValuationPoint,
  capTableBase: CapTableBase,
  dilutionEvents: DilutionEvent[],
  asOfDate: string,
): PurchasePlanSnapshot => {
  const entryFD = computeFD(capTableBase, dilutionEvents, entryValuation.date);
  const currentFD = computeFD(capTableBase, dilutionEvents, asOfDate);
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
  let investedTotal = 0;
  let sharesTotal = 0;
  let numPurchasesExecuted = 0;
  for (const date of purchaseDates) {
    const amount = getMonthlyAmountEffective(plan, date);
    investedTotal += amount;
    if (amount > 0) {
      sharesTotal += amount / purchaseSharePrice;
      numPurchasesExecuted += 1;
    }
  }
  const avgCost = sharesTotal > 0 ? investedTotal / sharesTotal : 0;
  const currentSharePrice = computeSharePrice(
    currentValuation.equityValue,
    currentFD,
  );
  const currentValue = sharesTotal * currentSharePrice;
  const gain = currentValue - investedTotal;
  const multiple = investedTotal > 0 ? currentValue / investedTotal : 0;

  return {
    numPurchasesExecuted,
    numMonthsEvaluated: purchaseDates.length,
    investedTotal,
    sharesTotal,
    avgCost,
    currentSharePrice,
    currentValue,
    gain,
    multiple,
  };
};
